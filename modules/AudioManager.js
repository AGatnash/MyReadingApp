export class AudioManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.soundsEnabled = true;
        this.speechPromptsEnabled = true;

        this.letterAudio = new Map();
        this.supportedLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        this.supportedLetters.forEach(letter => {
            const audio = new Audio(`assets/audio/letters/${letter}.mp3`);
            audio.preload = 'auto';
            this.letterAudio.set(letter, audio);
        });

        // Multi-letter grapheme clips (sh, ch, th, ee, ...) are loaded lazily
        // from assets/audio/graphemes/<grapheme>.mp3 the first time they play.
        this.graphemeAudio = new Map();

        // Pre-load voices if possible
        this.voice = null;
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoice();
        }
        this.loadVoice();
    }

    loadVoice() {
        const voices = this.synth.getVoices();
        // Try to find a good English voice
        this.voice = voices.find(v => v.lang.startsWith('en-GB')) ||
            voices.find(v => v.lang.startsWith('en-US')) ||
            voices[0];
    }

    setSoundsEnabled(enabled) {
        this.soundsEnabled = enabled;
    }

    setSpeechPromptsEnabled(enabled) {
        this.speechPromptsEnabled = enabled;
    }

    // Play the sound for any grapheme — a single letter or a digraph/trigraph.
    playGraphemeSound(grapheme) {
        if (!this.soundsEnabled) return;

        const g = grapheme.toLowerCase();

        // Single letters use the bundled per-letter phoneme clips.
        if (g.length === 1) {
            const letterClip = this.letterAudio.get(g);
            if (letterClip) {
                letterClip.currentTime = 0;
                letterClip.play().catch(() => this.playGraphemeFallback(g));
                return;
            }
            this.playGraphemeFallback(g);
            return;
        }

        // Multi-letter graphemes: load (and cache) an optional clip; if it is
        // missing or blocked, fall back to spoken synthesis.
        let clip = this.graphemeAudio.get(g);
        if (!clip) {
            clip = new Audio(`assets/audio/graphemes/${g}.mp3`);
            clip.preload = 'auto';
            this.graphemeAudio.set(g, clip);
        }
        clip.currentTime = 0;
        clip.play().catch(() => this.playGraphemeFallback(g));
    }

    // Backwards-compatible alias.
    playLetterSound(letter) {
        this.playGraphemeSound(letter);
    }

    playGraphemeFallback(grapheme) {
        // Cancel current speech to avoid queue buildup
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(grapheme);
        if (this.voice) utterance.voice = this.voice;

        // True phonemes are hard with TTS, but this keeps a fallback path.
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        this.synth.speak(utterance);
    }

    speakWord(word) {
        if (!this.soundsEnabled) return;

        // Cancel any queued speech so the blended word lands cleanly.
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(word);
        if (this.voice) utterance.voice = this.voice;
        // Slightly slower so the whole-word blend stays clear for a beginner.
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        this.synth.speak(utterance);
    }

    playSuccess() {
        if (!this.soundsEnabled) return;

        const utterance = new SpeechSynthesisUtterance("Excellent!");
        if (this.voice) utterance.voice = this.voice;
        utterance.pitch = 1.2;
        utterance.rate = 1.2;
        this.synth.speak(utterance);
    }

    playFailure() {
        if (!this.soundsEnabled) return;

        const utterance = new SpeechSynthesisUtterance("Try again.");
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = 1.1;
        this.synth.speak(utterance);
    }
}
