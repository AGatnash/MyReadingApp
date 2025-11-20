export class UIManager {
    constructor() {
        this.grid = document.getElementById('letter-grid');
        this.prefixDisplay = document.getElementById('prefix-display');
        this.btnBack = document.getElementById('btn-back');
        this.btnClear = document.getElementById('btn-clear');
        this.btnSettings = document.getElementById('btn-settings');
        this.btnCloseSettings = document.getElementById('btn-close-settings');
        this.settingsModal = document.getElementById('settings-modal');
        this.btnRead = document.getElementById('btn-read');
        this.actionArea = document.getElementById('action-area');

        // Settings elements
        this.wordListInput = document.getElementById('word-list-input');
        this.btnSaveWords = document.getElementById('btn-save-words');
        this.completedLog = document.getElementById('completed-log');
        this.btnClearLog = document.getElementById('btn-clear-log');
        this.toggleSounds = document.getElementById('toggle-sounds');
        this.toggleSpeechPrompts = document.getElementById('toggle-speech-prompts');

        this.callbacks = {};
        this.alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

        this.bindInternalEvents();
    }

    bindInternalEvents() {
        this.btnBack.addEventListener('click', () => this.emit('back'));
        this.btnClear.addEventListener('click', () => this.emit('clear'));
        this.btnRead.addEventListener('click', () => this.emit('read'));

        this.btnSettings.addEventListener('click', () => this.toggleSettings(true));
        this.btnCloseSettings.addEventListener('click', () => this.toggleSettings(false));

        this.btnSaveWords.addEventListener('click', () => {
            this.emit('saveWords', this.wordListInput.value);
            this.toggleSettings(false);
        });

        this.btnClearLog.addEventListener('click', () => this.emit('clearLog'));

        this.toggleSounds.addEventListener('change', (e) => this.emit('toggleSounds', e.target.checked));
        this.toggleSpeechPrompts.addEventListener('change', (e) => this.emit('toggleSpeechPrompts', e.target.checked));
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event](data);
        }
    }

    renderGrid(validLetters) {
        this.grid.innerHTML = '';
        this.alphabet.forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'letter-btn';
            btn.textContent = letter;

            if (validLetters.has(letter)) {
                btn.onclick = () => this.emit('letterClick', letter);
            } else {
                btn.classList.add('disabled');
                btn.disabled = true;
            }

            this.grid.appendChild(btn);
        });
    }

    updatePrefix(prefix, isComplete) {
        this.prefixDisplay.textContent = prefix;
        this.prefixDisplay.className = prefix ? '' : 'empty';
        if (isComplete) {
            this.prefixDisplay.classList.add('complete');
            this.btnRead.classList.remove('hidden');
        } else {
            this.btnRead.classList.add('hidden');
        }
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
    }
}
