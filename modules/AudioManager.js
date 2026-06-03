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

    playLetterSound(letter) {
        if (!this.soundsEnabled) return;

        const normalizedLetter = letter.toLowerCase();
        const letterClip = this.letterAudio.get(normalizedLetter);

        if (letterClip) {
            // Keep letter clips snappy and avoid overlap buildup.
            letterClip.currentTime = 0;
            letterClip.play().catch(() => {
                // Browser autoplay protections can still block playback.
                this.playLetterFallback(normalizedLetter);
            });
            return;
        }

        this.playLetterFallback(normalizedLetter);
    }

    playLetterFallback(letter) {
        // Cancel current speech to avoid queue buildup
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(letter);
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
