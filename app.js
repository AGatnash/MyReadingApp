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
            completedWords: Storage.get('readstar_completed', [])
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

    render() {
        const validNext = this.wordManager.getValidNextLetters(this.state.prefix);
        const isComplete = this.wordManager.isCompleteWord(this.state.prefix);

        this.ui.updatePrefix(this.state.prefix, isComplete);
        this.ui.renderGrid(validNext);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new App();
});
