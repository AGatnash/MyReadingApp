export class UIManager {
    constructor() {
        this.introScreen = document.getElementById('intro-screen');
        this.introTitle = document.getElementById('intro-title');
        this.btnOpenReadstar = document.getElementById('btn-open-readstar');
        this.btnOpenLetterCrunch = document.getElementById('btn-open-letter-crunch');
        this.mainApp = document.getElementById('main-app');
        this.letterCrunchApp = document.getElementById('letter-crunch-app');
        this.levelSelect = document.getElementById('level-select');
        this.levelGrid = document.getElementById('level-grid');
        this.levelBanner = document.getElementById('level-banner');
        this.btnLevelHome = document.getElementById('btn-level-home');
        this.grid = document.getElementById('letter-grid');
        this.prefixDisplay = document.getElementById('prefix-display');
        this.btnBack = document.getElementById('btn-back');
        this.btnClear = document.getElementById('btn-clear');
        this.btnSettings = document.getElementById('btn-settings');
        this.btnCloseSettings = document.getElementById('btn-close-settings');
        this.settingsModal = document.getElementById('settings-modal');
        this.btnRead = document.getElementById('btn-read');
        this.btnSoundOut = document.getElementById('btn-sound-out');
        this.actionArea = document.getElementById('action-area');
        this.btnLetterCrunchHome = document.getElementById('btn-letter-crunch-home');
        this.btnLetterCrunchReset = document.getElementById('btn-letter-crunch-reset');
        this.player1Score = document.getElementById('player1-score');
        this.player2Score = document.getElementById('player2-score');
        this.letterCrunchLetter = document.getElementById('letter-crunch-letter');
        this.letterCrunchStatus = document.getElementById('letter-crunch-status');
        this.leftCrocodile = document.getElementById('left-crocodile');
        this.rightCrocodile = document.getElementById('right-crocodile');
        this.btnPlayer1 = document.getElementById('btn-player1');
        this.btnPlayer2 = document.getElementById('btn-player2');

        // Settings elements
        this.wordListInput = document.getElementById('word-list-input');
        this.btnSaveWords = document.getElementById('btn-save-words');
        this.completedLog = document.getElementById('completed-log');
        this.btnClearLog = document.getElementById('btn-clear-log');
        this.toggleSounds = document.getElementById('toggle-sounds');
        this.toggleSpeechPrompts = document.getElementById('toggle-speech-prompts');
        this.toggleLetterFilter = document.getElementById('toggle-letter-filter');

        this.callbacks = {};
        this.alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

        this.bindInternalEvents();
    }

    bindInternalEvents() {
        this.btnOpenReadstar.addEventListener('click', () => this.emit('openReadstar'));
        this.btnOpenLetterCrunch.addEventListener('click', () => this.emit('openLetterCrunch'));

        this.btnBack.addEventListener('click', () => this.emit('back'));
        this.btnClear.addEventListener('click', () => this.emit('clear'));
        this.btnRead.addEventListener('click', () => this.emit('read'));
        this.btnSoundOut.addEventListener('click', () => this.emit('soundOut'));

        this.btnSettings.addEventListener('click', () => this.toggleSettings(true));
        this.btnCloseSettings.addEventListener('click', () => this.toggleSettings(false));

        this.btnSaveWords.addEventListener('click', () => {
            this.emit('saveWords', this.wordListInput.value);
            this.toggleSettings(false);
        });

        this.btnClearLog.addEventListener('click', () => this.emit('clearLog'));

        this.toggleSounds.addEventListener('change', (e) => this.emit('toggleSounds', e.target.checked));
        this.toggleSpeechPrompts.addEventListener('change', (e) => this.emit('toggleSpeechPrompts', e.target.checked));
        this.toggleLetterFilter.addEventListener('change', (e) => this.emit('toggleLetterFilter', e.target.checked));

        this.btnLevelHome.addEventListener('click', () => this.emit('showHome'));

        this.btnLetterCrunchHome.addEventListener('click', () => this.emit('showHome'));
        this.btnLetterCrunchReset.addEventListener('click', () => this.emit('resetLetterCrunch'));

        this.btnPlayer1.addEventListener('pointerdown', () => this.emit('letterCrunchHoldStart', 1));
        this.btnPlayer2.addEventListener('pointerdown', () => this.emit('letterCrunchHoldStart', 2));
        this.btnPlayer1.addEventListener('pointerup', () => this.emit('letterCrunchHoldEnd', 1));
        this.btnPlayer2.addEventListener('pointerup', () => this.emit('letterCrunchHoldEnd', 2));
        this.btnPlayer1.addEventListener('pointercancel', () => this.emit('letterCrunchHoldEnd', 1));
        this.btnPlayer2.addEventListener('pointercancel', () => this.emit('letterCrunchHoldEnd', 2));
        this.btnPlayer1.addEventListener('pointerleave', (event) => {
            if (event.buttons === 1) this.emit('letterCrunchHoldEnd', 1);
        });
        this.btnPlayer2.addEventListener('pointerleave', (event) => {
            if (event.buttons === 1) this.emit('letterCrunchHoldEnd', 2);
        });
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event](data);
        }
    }

    renderGrid(validLetters, filterEnabled = true) {
        this.grid.innerHTML = '';
        this.alphabet.forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'letter-btn';
            btn.textContent = letter;

            // When the guide filter is off, every letter is selectable so the
            // child chooses by sound instead of following the only lit button.
            if (!filterEnabled || validLetters.has(letter)) {
                btn.onclick = () => this.emit('letterClick', letter);
            } else {
                btn.classList.add('disabled');
                btn.disabled = true;
            }

            this.grid.appendChild(btn);
        });
    }

    updatePrefix(prefix, isComplete) {
        // Render each letter as its own span so the blending ("sound it out")
        // sequence can highlight letters one at a time.
        this.prefixDisplay.innerHTML = '';
        for (const ch of prefix) {
            const span = document.createElement('span');
            span.className = 'prefix-letter';
            span.textContent = ch;
            this.prefixDisplay.appendChild(span);
        }
        this.prefixDisplay.className = prefix ? '' : 'empty';
        if (isComplete) {
            this.prefixDisplay.classList.add('complete');
            this.btnRead.classList.remove('hidden');
            this.btnSoundOut.classList.remove('hidden');
        } else {
            this.btnRead.classList.add('hidden');
            this.btnSoundOut.classList.add('hidden');
        }
    }

    highlightLetter(index) {
        const letters = this.prefixDisplay.querySelectorAll('.prefix-letter');
        letters.forEach((el, i) => el.classList.toggle('blending', i === index));
    }

    highlightWholeWord() {
        this.prefixDisplay.querySelectorAll('.prefix-letter')
            .forEach(el => el.classList.add('blending'));
    }

    clearBlendHighlight() {
        this.prefixDisplay.querySelectorAll('.prefix-letter')
            .forEach(el => el.classList.remove('blending'));
    }

    setBlending(active) {
        this.btnSoundOut.classList.toggle('blending', active);
        this.btnSoundOut.disabled = active;
        this.btnRead.disabled = active;
    }

    toggleSettings(show) {
        if (show) {
            this.settingsModal.classList.remove('hidden');
            this.emit('openSettings'); // To populate data
        } else {
            this.settingsModal.classList.add('hidden');
        }
    }

    populateSettings(wordList, completedWords, settings) {
        this.wordListInput.value = wordList.join('\n');

        this.completedLog.innerHTML = completedWords.map(word =>
            `<div>${word} <span style="color:#ccc;font-size:0.8em">✓</span></div>`
        ).join('');

        this.toggleSounds.checked = settings.soundsEnabled;
        this.toggleSpeechPrompts.checked = settings.speechPromptsEnabled;
        this.toggleLetterFilter.checked = settings.filterEnabled;
    }

    hideAllScreens() {
        this.introScreen.classList.add('hidden');
        this.levelSelect.classList.add('hidden');
        this.mainApp.classList.add('hidden');
        this.letterCrunchApp.classList.add('hidden');
    }

    showMainApp() {
        this.hideAllScreens();
        this.mainApp.classList.remove('hidden');
    }

    showLetterCrunchApp() {
        this.hideAllScreens();
        this.letterCrunchApp.classList.remove('hidden');
    }

    showHome() {
        this.hideAllScreens();
        this.introScreen.classList.remove('hidden');
    }

    showLevelSelect() {
        this.hideAllScreens();
        this.levelSelect.classList.remove('hidden');
    }

    setLevelBanner(text) {
        this.levelBanner.textContent = text;
    }

    // Render the level cards from view-models:
    // { id, name, letters, got, total, mastered, locked, isCustom }
    renderLevelSelect(levels) {
        this.levelGrid.innerHTML = '';
        levels.forEach(level => {
            const card = document.createElement('button');
            card.className = 'level-card';
            if (level.locked) card.classList.add('locked');
            if (level.mastered) card.classList.add('mastered');
            if (level.isCustom) card.classList.add('custom');

            let progressText;
            if (level.locked) {
                progressText = '🔒 Locked';
            } else if (level.isCustom) {
                progressText = `${level.total} words`;
            } else {
                progressText = level.mastered
                    ? `★ ${level.got}/${level.total}`
                    : `${level.got}/${level.total}`;
            }

            card.innerHTML = `
                <span class="level-name">${level.name}</span>
                <span class="level-letters">${level.letters}</span>
                <span class="level-progress">${progressText}</span>
            `;

            if (level.locked) {
                card.disabled = true;
            } else {
                card.addEventListener('click', () => this.emit('selectLevel', level.id));
            }

            this.levelGrid.appendChild(card);
        });
    }

    updateLetterCrunch(state) {
        this.letterCrunchLetter.textContent = state.currentLetter.toUpperCase();
        this.player1Score.textContent = `Player 1: ${state.scores[1]}`;
        this.player2Score.textContent = `Player 2: ${state.scores[2]}`;
        this.player1Score.classList.toggle('active', state.currentPlayer === 1);
        this.player2Score.classList.toggle('active', state.currentPlayer === 2);
        this.letterCrunchStatus.textContent = state.status;
        this.btnPlayer1.disabled = state.currentPlayer !== 1 || state.isListening;
        this.btnPlayer2.disabled = state.currentPlayer !== 2 || state.isListening;
        this.btnPlayer1.classList.toggle('listening', state.currentPlayer === 1 && state.isListening);
        this.btnPlayer2.classList.toggle('listening', state.currentPlayer === 2 && state.isListening);
    }

    animateCrunch(player) {
        const target = player === 1 ? this.leftCrocodile : this.rightCrocodile;
        target.classList.remove('snap');
        // Restart animation by forcing reflow
        void target.offsetWidth;
        target.classList.add('snap');
    }
}
