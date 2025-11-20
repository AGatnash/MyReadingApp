export class AudioManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.soundsEnabled = true;
        this.speechPromptsEnabled = true;

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

        // Cancel current speech to avoid queue buildup
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(letter.toLowerCase());
        if (this.voice) utterance.voice = this.voice;

        // Adjust properties for a more natural letter sound if possible
        // Note: True phonemes are hard with TTS, but we do our best.
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        this.synth.speak(utterance);
    }

    playSuccess() {
        if (!this.soundsEnabled) return;

        // Simple success chime using Web Audio API would be better, 
        // but for now let's use a cheerful TTS message or just a placeholder.
        // Let's generate a simple beep for now using AudioContext if we wanted, 
        // but sticking to TTS for consistency as per spec option.

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
