import { Storage } from './Storage.js';

export class WordManager {
    constructor() {
        this.words = new Set();
        this.prefixMap = new Map();
        this.defaultWords = [
            "cat", "dog", "bat", "ball", "apple", "ant", "big", "box", "car", "cup",
            "dad", "mom", "sun", "run", "top", "hat", "hot", "hit", "sit", "sat",
            "mat", "map", "man", "pan", "pin", "pig", "wig", "win", "wet", "web",
            "bus", "bed", "red", "blue", "green", "one", "two", "three", "four", "five"
        ];
        this.STORAGE_KEY = 'readstar_words';
        this.init();
    }

    init() {
        const storedWords = Storage.get(this.STORAGE_KEY, this.defaultWords);
        this.setWords(storedWords);
    }

    setWords(wordList) {
        this.words = new Set(wordList.map(w => w.toLowerCase().trim()).filter(w => w.length > 0));
        this.buildPrefixMap();
        Storage.set(this.STORAGE_KEY, Array.from(this.words));
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
            // Mark end of word? 
            // The spec implies we just need to know valid *next* letters.
            // We can check if a prefix is a complete word separately.
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

    addWord(word) {
        const cleanWord = word.toLowerCase().trim();
        if (cleanWord && !this.words.has(cleanWord)) {
            this.words.add(cleanWord);
            this.buildPrefixMap();
            Storage.set(this.STORAGE_KEY, Array.from(this.words));
            return true;
        }
        return false;
    }

    resetToDefaults() {
        this.setWords(this.defaultWords);
    }
}
