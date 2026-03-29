import { WordManager } from './modules/WordManager.js';
import { UIManager } from './modules/UIManager.js';
import { Storage } from './modules/Storage.js';
import { AudioManager } from './modules/AudioManager.js';
import { SpeechRecognizer } from './modules/SpeechRecognizer.js';
import { Confetti } from './modules/Confetti.js';

class App {
    constructor() {
        this.wordManager = new WordManager();
        this.ui = new UIManager();
        this.audio = new AudioManager();
        this.speech = new SpeechRecognizer();
        this.confetti = new Confetti();

        this.state = {
            prefix: '',
            soundsEnabled: Storage.get('readstar_sounds', true),
            speechPromptsEnabled: Storage.get('readstar_speech', true),
            completedWords: Storage.get('readstar_completed', []),
            letterCrunch: {
                scores: { 1: 0, 2: 0 },
                currentPlayer: 1,
                currentLetter: this.getRandomLetter(),
                isListening: false,
                status: 'Player 1, hold your side and say the letter.'
            }
        };

        // Sync audio settings
        this.audio.setSoundsEnabled(this.state.soundsEnabled);
        this.audio.setSpeechPromptsEnabled(this.state.speechPromptsEnabled);

        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        this.ui.on('openReadstar', () => this.ui.showMainApp());
        this.ui.on('openLetterCrunch', () => {
            this.ui.showLetterCrunchApp();
            this.renderLetterCrunch();
        });
        this.ui.on('showHome', () => this.ui.showHome());
        this.ui.on('letterClick', (letter) => this.handleLetterClick(letter));
        this.ui.on('back', () => this.handleBack());
        this.ui.on('clear', () => this.handleClear());
        this.ui.on('read', () => this.handleRead());

        this.ui.on('openSettings', () => {
            this.ui.populateSettings(
                this.wordManager.getWords(),
                this.state.completedWords,
                {
                    soundsEnabled: this.state.soundsEnabled,
                    speechPromptsEnabled: this.state.speechPromptsEnabled
                }
            );
        });

        this.ui.on('saveWords', (text) => {
            const words = text.split('\n');
            this.wordManager.setWords(words);
            this.handleClear(); // Reset state on word list change
        });

        this.ui.on('clearLog', () => {
            this.state.completedWords = [];
            Storage.set('readstar_completed', []);
            this.ui.populateSettings(
                this.wordManager.getWords(),
                this.state.completedWords,
                {
                    soundsEnabled: this.state.soundsEnabled,
                    speechPromptsEnabled: this.state.speechPromptsEnabled
                }
            );
        });

        this.ui.on('toggleSounds', (enabled) => {
            this.state.soundsEnabled = enabled;
            Storage.set('readstar_sounds', enabled);
            this.audio.setSoundsEnabled(enabled);
        });

        this.ui.on('toggleSpeechPrompts', (enabled) => {
            this.state.speechPromptsEnabled = enabled;
            Storage.set('readstar_speech', enabled);
            this.audio.setSpeechPromptsEnabled(enabled);
        });

        this.ui.on('letterCrunchHoldStart', (player) => this.handleLetterCrunchHoldStart(player));
        this.ui.on('letterCrunchHoldEnd', (player) => this.handleLetterCrunchHoldEnd(player));
        this.ui.on('resetLetterCrunch', () => this.resetLetterCrunch());
    }

    handleLetterClick(letter) {
        const newPrefix = this.state.prefix + letter;
        if (this.wordManager.isValidNextLetter(this.state.prefix, letter)) {
            this.state.prefix = newPrefix;
            this.render();
            this.audio.playLetterSound(letter);
        }
    }

    handleBack() {
        if (this.state.prefix.length > 0) {
            this.state.prefix = this.state.prefix.slice(0, -1);
            this.render();
        }
    }

    handleClear() {
        this.state.prefix = '';
        this.render();
    }

    handleRead() {
        if (!this.speech.isSupported) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        this.ui.btnRead.classList.add('listening');

        this.speech.start(
            (transcript) => {
                this.ui.btnRead.classList.remove('listening');
                this.verifySpokenWord(transcript);
            },
            (error) => {
                this.ui.btnRead.classList.remove('listening');
                console.error("Speech error:", error);
            }
        );
    }

    verifySpokenWord(transcript) {
        const target = this.state.prefix.toLowerCase();
        const spoken = transcript.toLowerCase().trim();

        console.log(`Target: ${target}, Spoken: ${spoken}`);

        if (spoken.includes(target) || target.includes(spoken)) {
            this.handleWordComplete(this.state.prefix);
        } else {
            this.audio.playFailure();
        }
    }

    handleWordComplete(word) {
        this.audio.playSuccess();
        this.confetti.start();

        this.state.completedWords.unshift(word);
        Storage.set('readstar_completed', this.state.completedWords);

        setTimeout(() => {
            if (confirm(`Great job! You read "${word}". Start a new word?`)) {
                this.handleClear();
            }
        }, 1500);
    }

    handleLetterCrunchHoldStart(player) {
        const game = this.state.letterCrunch;
        if (player !== game.currentPlayer || game.isListening) return;

        if (!this.speech.isSupported) {
            game.status = "Speech recognition isn't supported in this browser.";
            this.renderLetterCrunch();
            return;
        }

        game.isListening = true;
        game.status = `Listening... Player ${player}, say "${game.currentLetter.toUpperCase()}".`;
        this.renderLetterCrunch();

        this.speech.start(
            (transcript) => {
                game.isListening = false;
                this.handleLetterCrunchGuess(transcript, player);
            },
            (error) => {
                game.isListening = false;
                game.status = `Couldn't hear that (${error}). Player ${player}, try again.`;
                this.renderLetterCrunch();
            }
        );
    }

    handleLetterCrunchHoldEnd(player) {
        const game = this.state.letterCrunch;
        if (player !== game.currentPlayer || !game.isListening) return;
        this.speech.stop();
    }

    handleLetterCrunchGuess(transcript, player) {
        const game = this.state.letterCrunch;
        const spoken = this.normalizeLetterGuess(transcript);
        const target = game.currentLetter;

        if (spoken === target) {
            game.scores[player] += 1;
            game.status = `Nice! Player ${player} got ${target.toUpperCase()} correct.`;
            this.ui.animateCrunch(player);
            this.audio.playSuccess();
            game.currentLetter = this.getRandomLetter();
        } else {
            game.status = `Heard "${transcript}". Needed "${target.toUpperCase()}".`;
            this.audio.playFailure();
        }

        game.currentPlayer = game.currentPlayer === 1 ? 2 : 1;
        game.status += ` Player ${game.currentPlayer}, your turn.`;
        this.renderLetterCrunch();
    }

    normalizeLetterGuess(transcript) {
        const cleaned = transcript.toLowerCase().trim().replace(/[^a-z\s]/g, '');
        if (!cleaned) return '';
        const collapsed = cleaned.replace(/\s+/g, ' ');
        const words = collapsed.split(' ');
        const lastWord = words[words.length - 1];

        const phoneticMap = {
            a: ['a', 'ay', 'eh'],
            b: ['b', 'bee', 'be'],
            c: ['c', 'cee', 'see'],
            d: ['d', 'dee'],
            e: ['e'],
            f: ['f', 'ef'],
            g: ['g', 'gee'],
            h: ['h', 'aitch', 'hitch'],
            i: ['i', 'eye'],
            j: ['j', 'jay'],
            k: ['k', 'kay'],
            l: ['l', 'el'],
            m: ['m', 'em'],
            n: ['n', 'en'],
            o: ['o', 'oh'],
            p: ['p', 'pee'],
            q: ['q', 'cue', 'queue'],
            r: ['r', 'are'],
            s: ['s', 'ess'],
            t: ['t', 'tee', 'tea'],
            u: ['u', 'you'],
            v: ['v', 'vee'],
            w: ['w', 'doubleyou', 'double'],
            x: ['x', 'ex'],
            y: ['y', 'why'],
            z: ['z', 'zee', 'zed']
        };

        const singleChar = lastWord.replace(/\s/g, '');
        if (singleChar.length === 1 && /[a-z]/.test(singleChar)) {
            return singleChar;
        }

        for (const [letter, options] of Object.entries(phoneticMap)) {
            if (options.includes(lastWord)) return letter;
        }
        return '';
    }

    getRandomLetter() {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        return letters[Math.floor(Math.random() * letters.length)];
    }

    resetLetterCrunch() {
        this.state.letterCrunch = {
            scores: { 1: 0, 2: 0 },
            currentPlayer: 1,
            currentLetter: this.getRandomLetter(),
            isListening: false,
            status: 'Player 1, hold your side and say the letter.'
        };
        this.renderLetterCrunch();
    }

    renderLetterCrunch() {
        this.ui.updateLetterCrunch(this.state.letterCrunch);
    }

    render() {
        const validNext = this.wordManager.getValidNextLetters(this.state.prefix);
        const isComplete = this.wordManager.isCompleteWord(this.state.prefix);

        this.ui.updatePrefix(this.state.prefix, isComplete);
        this.ui.renderGrid(validNext);
        this.renderLetterCrunch();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new App();
});
