import { Storage } from './Storage.js';

// A "grapheme" is a single sound's spelling — one letter (s, a, t) or several
// (sh, ch, th, ng, ck, ee, oo, ai, oa). Words in the built-in levels carry an
// explicit segmentation: multi-letter graphemes are separated with a dot, e.g.
// "sh.i.p" -> ["sh","i","p"], "f.ee.t" -> ["f","ee","t"]. Plain words with no
// dot (e.g. "stop") are split per character. English can't be auto-segmented
// reliably, so the segmentation is authored, which is also pedagogically right.
const GRAPHEME_SEP = '.';

function segmentWord(entry) {
    const graphemes = entry.includes(GRAPHEME_SEP)
        ? entry.split(GRAPHEME_SEP)
        : entry.split('');
    return graphemes.map(g => g.toLowerCase().trim()).filter(g => g.length > 0);
}

export class WordManager {
    constructor() {
        this.words = new Set();            // active spellings, e.g. "ship"
        this.wordGraphemes = new Map();    // spelling -> ["sh","i","p"]
        this.prefixMap = new Map();        // prefix spelling -> Set(next graphemes)
        this.multiGraphemes = new Set();   // multi-letter graphemes in active set

        // Built-in levels follow a systematic synthetic-phonics sequence
        // (Letters & Sounds Phases 2-4). Each word only uses graphemes
        // introduced up to its level, so "Sound it out" blends accurately.
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
            },
            {
                // Blends need no new tiles — they are two single-letter graphemes
                // side by side (CCVC / CVCC). This trains reading adjacent sounds.
                id: 'level6', name: 'Level 6', letters: 'blends',
                words: ["stop", "spin", "step", "plan", "plug", "clap", "clip", "flag",
                    "flap", "frog", "drum", "drop", "grin", "glad", "slip", "slug", "snap",
                    "trap", "trip", "crab", "skip", "hand", "land", "lamp", "bump", "help",
                    "belt", "milk", "gift", "soft", "fast", "nest", "best", "must", "sand",
                    "pond", "bend", "tent"]
            },
            {
                id: 'level7', name: 'Level 7', letters: 'sh ch th',
                words: ["sh.i.p", "sh.o.p", "sh.e.d", "f.i.sh", "d.i.sh", "c.a.sh",
                    "r.u.sh", "ch.i.n", "ch.i.p", "ch.o.p", "ch.a.t", "r.i.ch", "m.u.ch",
                    "s.u.ch", "th.i.n", "th.i.s", "th.e.n", "th.a.t", "b.a.th", "p.a.th",
                    "m.o.th"]
            },
            {
                id: 'level8', name: 'Level 8', letters: 'ng ck',
                words: ["r.i.ng", "k.i.ng", "s.i.ng", "s.o.ng", "l.o.ng", "b.a.ng",
                    "h.a.ng", "r.u.ng", "d.u.ck", "s.o.ck", "r.o.ck", "k.i.ck", "p.i.ck",
                    "s.i.ck", "l.o.ck", "b.a.ck", "p.a.ck", "n.e.ck"]
            },
            {
                id: 'level9', name: 'Level 9', letters: 'ee oo',
                words: ["s.ee", "f.ee.t", "s.ee.d", "k.ee.p", "d.ee.p", "f.ee.l",
                    "n.ee.d", "m.ee.t", "f.ee.d", "m.oo.n", "b.oo.t", "f.oo.d", "c.oo.l",
                    "s.oo.n", "g.oo.d", "b.oo.k", "l.oo.k", "t.oo.k", "c.oo.k", "f.oo.t"]
            },
            {
                id: 'level10', name: 'Level 10', letters: 'ai oa',
                words: ["r.ai.n", "p.ai.n", "m.ai.n", "t.ai.l", "s.ai.l", "n.ai.l",
                    "p.ai.d", "m.ai.d", "ai.m", "c.oa.t", "r.oa.d", "s.oa.p", "g.oa.t",
                    "l.oa.d", "b.oa.t", "f.oa.m", "oa.k", "g.oa.l"]
            }
        ];

        this.CUSTOM_ID = 'custom';
        this.STORAGE_KEY = 'readstar_words';   // editable "Custom" word list
        this.LEVEL_KEY = 'readstar_level';     // currently selected level id
        this.alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

        // Custom list defaults to every built-in word as a plain spelling.
        this.customWords = Storage.get(this.STORAGE_KEY, this.allLevelSpellings());
        this.activeLevel = Storage.get(this.LEVEL_KEY, this.LEVELS[0].id);

        this.applyActiveLevel();
    }

    allLevelSpellings() {
        return this.LEVELS.flatMap(level =>
            level.words.map(entry => segmentWord(entry).join('')));
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

    // Rebuild the active word set, segmentation, and prefix map.
    applyActiveLevel() {
        let entries;
        if (this.activeLevel === this.CUSTOM_ID) {
            entries = this.customWords;
        } else {
            const level = this.LEVELS.find(l => l.id === this.activeLevel);
            entries = level ? level.words : this.customWords;
        }

        this.words = new Set();
        this.wordGraphemes = new Map();
        this.multiGraphemes = new Set();

        for (const entry of entries) {
            const graphemes = segmentWord(entry);
            if (graphemes.length === 0) continue;
            const spelling = graphemes.join('');
            this.words.add(spelling);
            this.wordGraphemes.set(spelling, graphemes);
            for (const g of graphemes) {
                if (g.length > 1) this.multiGraphemes.add(g);
            }
        }

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

    // Plain spellings for a list of (possibly dot-segmented) word entries.
    spellingsOf(entries) {
        return entries.map(entry => segmentWord(entry).join(''));
    }

    // Tile inventory: the 26 single letters (always shown so filter-off keeps
    // the full alphabet) plus any multi-letter graphemes used by this level.
    getGraphemeInventory() {
        return [...this.alphabet, ...Array.from(this.multiGraphemes).sort()];
    }

    buildPrefixMap() {
        this.prefixMap.clear();
        this.prefixMap.set('', new Set());

        for (const graphemes of this.wordGraphemes.values()) {
            let prefix = '';
            for (const g of graphemes) {
                if (!this.prefixMap.has(prefix)) {
                    this.prefixMap.set(prefix, new Set());
                }
                this.prefixMap.get(prefix).add(g);
                prefix += g;
            }
        }
    }

    isValidNextGrapheme(prefix, grapheme) {
        const validNext = this.prefixMap.get(prefix);
        return validNext ? validNext.has(grapheme) : false;
    }

    getValidNextGraphemes(prefix) {
        return this.prefixMap.get(prefix) || new Set();
    }

    isCompleteWord(text) {
        return this.words.has(text);
    }
}
