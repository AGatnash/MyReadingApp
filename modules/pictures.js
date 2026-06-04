// Word -> emoji "pictures" for attaching meaning to decoded/built words.
// Emoji are used instead of image files so the app stays fully offline with no
// asset sourcing or licensing. Only high-confidence, child-recognizable,
// non-violent pictures are included; words with no clear emoji simply show no
// picture (the feature degrades gracefully).
//
// Covers the concrete nouns in the built-in decodable levels, plus a handful of
// common words a parent might add to the Custom list.
export const PICTURE_MAP = {
    // Level 2
    pin: '📌', pan: '🍳', map: '🗺️', man: '👨', dad: '👨', sad: '😢', mad: '😠',
    nap: '😴', tin: '🥫',
    // Level 3
    dog: '🐶', cat: '🐱', cap: '🧢', can: '🥫', pig: '🐷', pot: '🍲', kid: '🧒',
    gas: '⛽',
    // Level 4
    pen: '🖊️', ten: '🔟', net: '🥅', cup: '☕', nut: '🥜', sun: '☀️', rat: '🐀',
    red: '🟥', run: '🏃', mug: '🍵',
    // Level 5
    hat: '👒', ham: '🍖', hut: '🛖', hen: '🐔', bag: '👜', bat: '🦇', bed: '🛏️',
    bin: '🗑️', bus: '🚌', bug: '🐛', fan: '🪭', leg: '🦵', log: '🪵', lip: '👄',
    hug: '🤗', bun: '🥯',
    // Level 6 (blends)
    frog: '🐸', drum: '🥁', flag: '🚩', crab: '🦀', hand: '✋', lamp: '💡',
    milk: '🥛', gift: '🎁', nest: '🪺', tent: '⛺', slug: '🐌', clap: '👏',
    stop: '🛑', drop: '💧',
    // Level 7 (sh ch th)
    ship: '🚢', fish: '🐟', shop: '🏪', chip: '🍟', bath: '🛁', dish: '🍽️',
    cash: '💵',
    // Level 8 (ng ck)
    ring: '💍', king: '🤴', sing: '🎤', duck: '🦆', sock: '🧦', rock: '🪨',
    lock: '🔒',
    // Level 9 (ee oo)
    feet: '🦶', seed: '🌱', moon: '🌙', boot: '👢', food: '🍔', book: '📖',
    foot: '🦶',
    // Level 10 (ai oa)
    rain: '🌧️', coat: '🧥', road: '🛣️', soap: '🧼', goat: '🐐', boat: '⛵',
    oak: '🌳',
    // Common extras for Custom word lists
    mom: '👩', car: '🚗', ball: '⚽', apple: '🍎', egg: '🥚', cake: '🍰',
    star: '⭐', tree: '🌳', cow: '🐄', owl: '🦉', bee: '🐝', box: '📦', key: '🔑',
    web: '🕸️', ear: '👂', eye: '👁️', arm: '💪'
};

export function getPicture(word) {
    if (!word) return null;
    return PICTURE_MAP[word.toLowerCase()] || null;
}
