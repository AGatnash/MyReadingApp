import { Storage } from './Storage.js';

export class WordManager {
    constructor() {
        this.words = new Set();
        this.prefixMap = new Map();
        // Default words follow a systematic synthetic-phonics sequence
        // (Letters & Sounds Phase 2 letter order). Every word is a fully
        // decodable CVC/VC word using ONLY single-letter graphemes and short
        // vowels introduced up to that set — no digraphs (sh, th, ee), blends,
        // double letters, or irregular words. This keeps the letter-by-letter
        // "Sound it out" blend accurate. Group order = teaching order.
        this.defaultWords = [
            // Set 1: s a t p
            "at", "sat", "pat", "tap", "sap",
            // Set 2: + i n m d
            "am", "an", "in", "it", "sit", "pin", "pan", "tin", "tip", "nip",
            "dip", "nap", "map", "mat", "man", "mad", "dad", "did", "sad",
            // Set 3: + g o c k
            "on", "got", "dog", "cat", "can", "cap", "cot", "cod", "cog", "gap",
            "gas", "nag", "tag", "sag", "dig", "pig", "dot", "top", "pot", "pop",
            "mop", "not", "nod", "kid", "kit",
            // Set 4: + e u r
            "up", "us", "pet", "pen", "ten", "net", "men", "met", "get", "set",
            "den", "red", "peg", "cup", "cut", "nut", "sun", "gun", "run", "ran",
            "rat", "rap", "rim", "rip", "rod", "rot", "mud", "mug", "rug",
            // Set 5: + h b f l
            "hat", "had", "ham", "hit", "hot", "hut", "hop", "hum", "hug", "him",
            "hip", "hen", "bad", "bag", "bat", "bed", "big", "bin", "bit", "bun",
            "bus", "bug", "but", "fan", "fat", "fig", "fin", "fun", "fed", "lap",
            "lad", "leg", "let", "lid", "lip", "lot", "log", "lit"
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
