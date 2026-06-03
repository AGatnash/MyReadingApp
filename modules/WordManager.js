import { Storage } from './Storage.js';

export class WordManager {
    constructor() {
        this.words = new Set();
        this.prefixMap = new Map();

        // Built-in levels follow a systematic synthetic-phonics sequence
        // (Letters & Sounds Phase 2 letter order). Every word is a fully
        // decodable CVC/VC word using ONLY single-letter graphemes and short
        // vowels introduced up to that level — no digraphs (sh, th, ee),
        // blends, double letters, or irregular words. This keeps the
        // letter-by-letter "Sound it out" blend accurate.
        this.LEVELS = [
            {
                id: 'level1', name: 'Level 1', letters: 's a t p',
                words: ["at", "sat", "pat", "tap", "sap"]
            },
            {
                id: 'level2', name: 'Level 2', letters: 'i n m d',
                words: ["am", "an", "in", "it", "sit", "pin", "pan", "tin", "tip",
                    "nip", "dip", "nap", "map", "mat", "man", "mad", "dad", "did", "sad"]
            },
            {
                id: 'level3', name: 'Level 3', letters: 'g o c k',
                words: ["on", "got", "dog", "cat", "can", "cap", "cot", "cod", "cog",
                    "gap", "gas", "nag", "tag", "sag", "dig", "pig", "dot", "top", "pot",
                    "pop", "mop", "not", "nod", "kid", "kit"]
            },
            {
                id: 'level4', name: 'Level 4', letters: 'e u r',
                words: ["up", "us", "pet", "pen", "ten", "net", "men", "met", "get",
                    "set", "den", "red", "peg", "cup", "cut", "nut", "sun", "gun", "run",
                    "ran", "rat", "rap", "rim", "rip", "rod", "rot", "mud", "mug", "rug"]
            },
            {
                id: 'level5', name: 'Level 5', letters: 'h b f l',
                words: ["hat", "had", "ham", "hit", "hot", "hut", "hop", "hum", "hug",
                    "him", "hip", "hen", "bad", "bag", "bat", "bed", "big", "bin", "bit",
                    "bun", "bus", "bug", "but", "fan", "fat", "fig", "fin", "fun", "fed",
                    "lap", "lad", "leg", "let", "lid", "lip", "lot", "log", "lit"]
            }
        ];

        this.CUSTOM_ID = 'custom';
        this.STORAGE_KEY = 'readstar_words';   // editable "Custom" word list
        this.LEVEL_KEY = 'readstar_level';     // currently selected level id

        // Custom list defaults to every built-in word (so an edited list keeps
        // working exactly as before levels existed).
        this.customWords = Storage.get(this.STORAGE_KEY, this.allLevelWords());

        // Selected level defaults to the first level.
        this.activeLevel = Storage.get(this.LEVEL_KEY, this.LEVELS[0].id);

        this.applyActiveLevel();
    }

    allLevelWords() {
        return this.LEVELS.flatMap(level => level.words);
    }

    getLevels() {
        return this.LEVELS;
    }

    getActiveLevel() {
        return this.activeLevel;
    }

    setActiveLevel(id) {
        this.activeLevel = id;
        Storage.set(this.LEVEL_KEY, id);
        this.applyActiveLevel();
    }

    // Rebuild the active word set + prefix map from whichever level is selected.
    applyActiveLevel() {
        let words;
        if (this.activeLevel === this.CUSTOM_ID) {
            words = this.customWords;
        } else {
            const level = this.LEVELS.find(l => l.id === this.activeLevel);
            words = level ? level.words : this.customWords;
        }
        this.words = new Set(words.map(w => w.toLowerCase().trim()).filter(w => w.length > 0));
        this.buildPrefixMap();
    }

    getCustomWords() {
        return [...this.customWords];
    }

    setCustomWords(wordList) {
        this.customWords = wordList.map(w => w.toLowerCase().trim()).filter(w => w.length > 0);
        Storage.set(this.STORAGE_KEY, this.customWords);
        if (this.activeLevel === this.CUSTOM_ID) {
            this.applyActiveLevel();
        }
    }

    getWords() {
        return Array.from(this.words).sort();
    }

    buildPrefixMap() {
        this.prefixMap.clear();

        // Initialize empty prefix to allow all starting letters
        this.prefixMap.set('', new Set());

        for (const word of this.words) {
            let prefix = '';
            for (const char of word) {
                if (!this.prefixMap.has(prefix)) {
                    this.prefixMap.set(prefix, new Set());
                }
                this.prefixMap.get(prefix).add(char);
                prefix += char;
            }
        }
    }

    isValidNextLetter(prefix, letter) {
        const validNext = this.prefixMap.get(prefix);
        return validNext ? validNext.has(letter) : false;
    }

    getValidNextLetters(prefix) {
        return this.prefixMap.get(prefix) || new Set();
    }

    isCompleteWord(text) {
        return this.words.has(text);
    }
}
