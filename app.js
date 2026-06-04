import { WordManager } from './modules/WordManager.js';
import { UIManager } from './modules/UIManager.js';
import { Storage } from './modules/Storage.js';
import { AudioManager } from './modules/AudioManager.js';
import { SpeechRecognizer } from './modules/SpeechRecognizer.js';
import { Confetti } from './modules/Confetti.js';
import { getPicture } from './modules/pictures.js';

const PHONETIC_MAP = {
    a: ['a', 'ay', 'eh', 'hey', 'aye'],
    b: ['b', 'bee', 'be', 'bea'],
    c: ['c', 'cee', 'see', 'sea', 'si'],
    d: ['d', 'dee', 'de', 'dea', 'the'],
    e: ['e', 'ee', 'he', 'hee', 'me', 'the'],
    f: ['f', 'ef', 'eff'],
    g: ['g', 'gee', 'ji', 'jee'],
    h: ['h', 'aitch', 'hitch', 'age', 'ache', 'each', 'aich', 'eight'],
    i: ['i', 'eye', 'aye', 'ai'],
    j: ['j', 'jay', 'je', 'jae'],
    k: ['k', 'kay', 'okay', 'kaye', 'ka'],
    l: ['l', 'el', 'ale', 'elle', 'ell'],
    m: ['m', 'em', 'him', 'am'],
    n: ['n', 'en', 'and', 'in', 'an', 'end'],
    o: ['o', 'oh', 'owe', 'ooh'],
    p: ['p', 'pee', 'pe', 'pi'],
    q: ['q', 'cue', 'queue', 'kew', 'kyu'],
    r: ['r', 'are', 'ar', 'our'],
    s: ['s', 'ess', 'es', 'as'],
    t: ['t', 'tee', 'tea', 'ti', 'te'],
    u: ['u', 'you', 'yu', 'ew'],
    v: ['v', 'vee', 've', 'vi'],
    w: ['w', 'doubleyou', 'double', 'dub'],
    x: ['x', 'ex', 'eggs', 'ecks'],
    y: ['y', 'why', 'wie'],
    z: ['z', 'zee', 'zed', 'ze', 'said']
};

// Fraction of a level's words a child must read to "master" it and unlock the
// next level. Below 100% on purpose: with a flaky mic (or a couple of stubborn
// words) requiring every single word could stall a learner. They can still go
// back and finish the rest.
const MASTERY_RATIO = 0.8;

function levenshteinDistance(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

class App {
    constructor() {
        this.wordManager = new WordManager();
        this.ui = new UIManager();
        this.audio = new AudioManager();
        this.speech = new SpeechRecognizer();
        this.confetti = new Confetti();

        this.state = {
            graphemes: [],
            mode: 'read',      // 'read' (ReadStar) or 'build' (Movable Alphabet)
            target: null,      // target spelling to build, in build mode
            isBlending: false,
            soundsEnabled: Storage.get('readstar_sounds', true),
            speechPromptsEnabled: Storage.get('readstar_speech', true),
            speechRecognitionEnabled: Storage.get('readstar_speech_check', true),
            filterEnabled: Storage.get('readstar_filter', true),
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
        this.syncSpeechAvailability();
        this.ui.showHome();
        this.render();
    }

    // The microphone check is offered only when the browser supports it AND
    // the parent hasn't switched it off.
    syncSpeechAvailability() {
        this.ui.setSpeechAvailable(this.speech.isSupported && this.state.speechRecognitionEnabled);
    }

    bindEvents() {
        this.ui.on('openReadstar', () => {
            this.state.mode = 'read';
            this.showLevelSelectScreen();
        });
        this.ui.on('openBuild', () => {
            this.state.mode = 'build';
            this.showLevelSelectScreen();
        });
        this.ui.on('selectLevel', (id) => this.handleSelectLevel(id));
        this.ui.on('openLetterCrunch', () => {
            this.ui.showLetterCrunchApp();
            this.renderLetterCrunch();
        });
        this.ui.on('showHome', () => this.ui.showHome());
        this.ui.on('graphemeClick', (grapheme) => this.handleGraphemeClick(grapheme));
        this.ui.on('back', () => this.handleBack());
        this.ui.on('clear', () => this.handleClear());
        this.ui.on('read', () => this.handleRead());
        this.ui.on('soundOut', () => this.handleSoundOut());
        this.ui.on('complete', () => this.handleManualComplete());
        this.ui.on('check', () => this.handleCheck());
        this.ui.on('hearWord', () => this.handleHearWord());

        this.ui.on('openSettings', () => {
            this.ui.populateSettings(
                this.wordManager.getCustomWords(),
                this.state.completedWords,
                {
                    soundsEnabled: this.state.soundsEnabled,
                    speechPromptsEnabled: this.state.speechPromptsEnabled,
                    speechRecognitionEnabled: this.state.speechRecognitionEnabled,
                    filterEnabled: this.state.filterEnabled
                }
            );
        });

        this.ui.on('saveWords', (text) => {
            const words = text.split('\n');
            this.wordManager.setCustomWords(words);
            // Editing the word list switches play to the Custom level.
            this.wordManager.setActiveLevel('custom');
            this.updateLevelBanner();
            this.handleClear(); // Reset state on word list change
        });

        this.ui.on('clearLog', () => {
            this.state.completedWords = [];
            Storage.set('readstar_completed', []);
            this.ui.populateSettings(
                this.wordManager.getCustomWords(),
                this.state.completedWords,
                {
                    soundsEnabled: this.state.soundsEnabled,
                    speechPromptsEnabled: this.state.speechPromptsEnabled,
                    speechRecognitionEnabled: this.state.speechRecognitionEnabled,
                    filterEnabled: this.state.filterEnabled
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

        this.ui.on('toggleSpeechRecognition', (enabled) => {
            this.state.speechRecognitionEnabled = enabled;
            Storage.set('readstar_speech_check', enabled);
            this.syncSpeechAvailability();
            this.render();
        });

        this.ui.on('toggleLetterFilter', (enabled) => {
            this.state.filterEnabled = enabled;
            Storage.set('readstar_filter', enabled);
            this.render();
        });

        this.ui.on('letterCrunchHoldStart', (player) => this.handleLetterCrunchHoldStart(player));
        this.ui.on('letterCrunchHoldEnd', (player) => this.handleLetterCrunchHoldEnd(player));
        this.ui.on('resetLetterCrunch', () => this.resetLetterCrunch());
    }

    currentWord() {
        return this.state.graphemes.join('');
    }

    handleGraphemeClick(grapheme) {
        if (this.state.isBlending) return;
        // In read mode with the guide filter on, only graphemes that continue a
        // real word are accepted. With the filter off — and always in build
        // mode (Movable Alphabet) — any tile is accepted so the child chooses by
        // sound and can make (and hear) their own mistakes.
        if (this.state.mode === 'read' && this.state.filterEnabled &&
            !this.wordManager.isValidNextGrapheme(this.currentWord(), grapheme)) {
            return;
        }
        this.state.graphemes.push(grapheme);
        this.render();
        this.audio.playGraphemeSound(grapheme);
    }

    handleBack() {
        if (this.state.isBlending) return;
        if (this.state.graphemes.length > 0) {
            this.state.graphemes.pop();
            this.render();
        } else {
            // Backing out of an empty word returns to the level picker.
            this.showLevelSelectScreen();
        }
    }

    showLevelSelectScreen() {
        this.ui.renderLevelSelect(this.buildLevelViewModels());
        this.ui.showLevelSelect();
    }

    // A level is mastered when every one of its words has been completed.
    // Each level unlocks only once the previous one is mastered; "Custom"
    // (the editable list) is always available.
    buildLevelViewModels() {
        const completed = new Set(this.state.completedWords);
        const vms = [];
        let prevMastered = true; // Level 1 is always unlocked.

        for (const level of this.wordManager.getLevels()) {
            // level.words may carry grapheme separators (e.g. "sh.i.p");
            // compare against plain spellings, which is what gets logged.
            const spellings = this.wordManager.spellingsOf(level.words);
            const got = spellings.filter(w => completed.has(w)).length;
            const total = spellings.length;
            const mastered = total > 0 && got >= Math.ceil(total * MASTERY_RATIO);
            vms.push({
                id: level.id,
                name: level.name,
                letters: level.letters,
                got,
                total,
                mastered,
                locked: !prevMastered,
                isCustom: false
            });
            prevMastered = mastered;
        }

        const custom = this.wordManager.getCustomWords();
        vms.push({
            id: 'custom',
            name: 'Custom',
            letters: '✎',
            got: 0,
            total: custom.length,
            mastered: false,
            locked: false,
            isCustom: true
        });

        return vms;
    }

    handleSelectLevel(id) {
        this.wordManager.setActiveLevel(id);
        this.state.graphemes = [];
        this.updateLevelBanner();
        this.ui.showMainApp();
        if (this.state.mode === 'build') {
            this.startBuildRound();
        } else {
            this.render();
        }
    }

    // Movable Alphabet: pick a target word, clear the board, say it aloud.
    startBuildRound() {
        const words = this.wordManager.getWords();
        if (words.length === 0) return;
        let next = words[Math.floor(Math.random() * words.length)];
        if (words.length > 1) {
            while (next === this.state.target) {
                next = words[Math.floor(Math.random() * words.length)];
            }
        }
        this.state.target = next;
        this.state.graphemes = [];
        this.render();
        this.audio.speakWord(next);
    }

    handleHearWord() {
        if (this.state.target) this.audio.speakWord(this.state.target);
    }

    handleCheck() {
        if (this.state.isBlending) return;
        const built = this.currentWord();
        if (!built) return;

        if (built === this.state.target) {
            this.audio.playSuccess();
            this.recordCompletion(built);
            setTimeout(() => this.startBuildRound(), 1500);
        } else {
            // Gentle: don't reveal the answer or wipe the board — let the child
            // self-correct with Back/Clear, and offer the word again.
            this.audio.playFailure();
        }
    }

    updateLevelBanner() {
        const id = this.wordManager.getActiveLevel();
        if (id === 'custom') {
            this.ui.setLevelBanner('Custom Words');
            return;
        }
        const level = this.wordManager.getLevels().find(l => l.id === id);
        this.ui.setLevelBanner(level ? `${level.name} · ${level.letters.toUpperCase()}` : '');
    }

    handleClear() {
        if (this.state.isBlending) return;
        this.state.graphemes = [];
        this.render();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async handleSoundOut() {
        const graphemes = this.state.graphemes;
        const word = this.currentWord();
        if (this.state.isBlending || !word) return;

        this.state.isBlending = true;
        this.ui.setBlending(true);

        // Step 1: highlight and sound each grapheme in turn (sh ... i ... p).
        for (let i = 0; i < graphemes.length; i++) {
            this.ui.highlightLetter(i);
            this.audio.playGraphemeSound(graphemes[i]);
            await this.delay(850);
        }

        // Step 2: blend — light up the whole word and say it as one.
        this.ui.highlightWholeWord();
        this.audio.speakWord(word);
        await this.delay(1200);

        this.ui.clearBlendHighlight();
        this.ui.setBlending(false);
        this.state.isBlending = false;
    }

    handleRead() {
        if (this.state.isBlending) return;
        // The mic button is only shown when speech is available, but guard
        // anyway and fail silently (the manual "I read it" button still works).
        if (!this.speech.isSupported || !this.state.speechRecognitionEnabled) return;

        this.ui.btnRead.classList.add('listening');

        this.speech.start(
            (transcripts) => {
                this.ui.btnRead.classList.remove('listening');
                this.verifySpokenWord(transcripts);
            },
            (error) => {
                this.ui.btnRead.classList.remove('listening');
                console.error("Speech error:", error);
                this.audio.playFailure();
            }
        );
    }

    // Forgiving match: accept the word if ANY recognizer alternative contains a
    // token that equals the target or is within a small edit distance of it.
    // Uses whole-word tokens (not substrings) so short targets like "at" are no
    // longer falsely matched by "cat", while still tolerating children's
    // mispronunciations and the recognizer mishearing them.
    verifySpokenWord(transcripts) {
        const target = this.currentWord().toLowerCase();
        // Edit-distance tolerance scaled to word length. Short CVC words use 0
        // (so "at" is never matched by "cat"); longer words tolerate a slip or
        // two. Forgiveness comes mainly from checking all recognizer
        // alternatives and the always-available manual "I read it" button.
        const tolerance = target.length <= 3 ? 0 : (target.length <= 6 ? 1 : 2);

        const matched = transcripts.some(transcript => {
            const tokens = transcript.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
            return tokens.some(token =>
                token.length > 0 && levenshteinDistance(token, target) <= tolerance);
        });

        console.log(`Target: ${target}, Heard: [${transcripts.join(' | ')}], Match: ${matched}`);

        if (matched) {
            this.handleWordComplete(target);
        } else {
            this.audio.playFailure();
        }
    }

    // Adult "they read it" tap — completes the word without the mic. Always
    // available, and the only completion path when speech is off/unsupported.
    handleManualComplete() {
        if (this.state.isBlending) return;
        const word = this.currentWord();
        if (this.wordManager.isCompleteWord(word)) {
            this.handleWordComplete(word);
        }
    }

    // Celebrate and log a word read/built (drives the completed-words log and
    // level mastery, regardless of which activity or completion path produced it).
    recordCompletion(word) {
        this.confetti.start();
        this.state.completedWords.unshift(word);
        Storage.set('readstar_completed', this.state.completedWords);
    }

    handleWordComplete(word) {
        this.audio.playSuccess();
        this.recordCompletion(word);

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
            (transcripts) => {
                game.isListening = false;
                this.handleLetterCrunchGuess(transcripts, player);
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

    handleLetterCrunchGuess(transcripts, player) {
        const game = this.state.letterCrunch;
        const target = game.currentLetter;
        // Accept if any recognizer alternative normalizes to the target letter.
        const correct = transcripts.some(t => this.normalizeLetterGuess(t, target) === target);

        if (correct) {
            game.scores[player] += 1;
            game.status = `Nice! Player ${player} got ${target.toUpperCase()} correct.`;
            this.ui.animateCrunch(player);
            this.audio.playSuccess();
            game.currentLetter = this.getRandomLetter();
        } else {
            game.status = `Heard "${transcripts[0] || ''}". Needed "${target.toUpperCase()}".`;
            this.audio.playFailure();
        }

        game.currentPlayer = game.currentPlayer === 1 ? 2 : 1;
        game.status += ` Player ${game.currentPlayer}, your turn.`;
        this.renderLetterCrunch();
    }

    normalizeLetterGuess(transcript, targetLetter) {
        const cleaned = transcript.toLowerCase().trim().replace(/[^a-z\s]/g, '');
        if (!cleaned) return '';

        const words = cleaned.replace(/\s+/g, ' ').split(' ');
        const fullCollapsed = cleaned.replace(/\s+/g, '');
        const targetVariants = PHONETIC_MAP[targetLetter] || [targetLetter];

        // Pass 1: Exact match against target variants (any word)
        for (const word of words) {
            if (targetVariants.includes(word)) return targetLetter;
        }

        // Pass 2: Single-char match for target
        for (const word of words) {
            if (word.length === 1 && word === targetLetter) return targetLetter;
        }

        // Pass 3: Fuzzy match against target variants
        for (const word of words) {
            for (const variant of targetVariants) {
                if (variant.length >= 2 && (word.startsWith(variant) || word.endsWith(variant))) {
                    return targetLetter;
                }
                if (levenshteinDistance(word, variant) <= 1) return targetLetter;
            }
        }

        // Pass 4: Collapsed transcript against target variants (e.g. "double you" for W)
        if (targetVariants.includes(fullCollapsed)) return targetLetter;

        // Pass 5: Fallback — identify if a different letter was spoken
        for (const word of words) {
            if (word.length === 1 && /[a-z]/.test(word)) return word;
            for (const [letter, variants] of Object.entries(PHONETIC_MAP)) {
                if (variants.includes(word)) return letter;
            }
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
        const inventory = this.wordManager.getGraphemeInventory();
        const hasContent = this.state.graphemes.length > 0;

        if (this.state.mode === 'build') {
            // Full board, no filtering or correctness reveal — the child must
            // choose each grapheme from the sounds they hear. The target's
            // picture is the meaning cue ("build the name of this thing").
            this.ui.updatePrefix(this.state.graphemes, false);
            this.ui.renderGrid(inventory, new Set(), false);
            this.ui.updateActions({ mode: 'build', isComplete: false, hasContent });
            this.ui.setPicture(getPicture(this.state.target));
        } else {
            const prefix = this.currentWord();
            const validNext = this.wordManager.getValidNextGraphemes(prefix);
            const isComplete = this.wordManager.isCompleteWord(prefix);
            this.ui.updatePrefix(this.state.graphemes, isComplete);
            this.ui.renderGrid(inventory, validNext, this.state.filterEnabled);
            this.ui.updateActions({ mode: 'read', isComplete, hasContent });
            // Reveal the picture only once the word is fully decoded.
            this.ui.setPicture(isComplete ? getPicture(prefix) : null);
        }

        this.renderLetterCrunch();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new App();
});
