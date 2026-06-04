export class SpeechRecognizer {
    constructor() {
        this.recognition = null;
        this.isSupported = false;

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US'; // Could be configurable
            // Ask for several guesses; children's speech is often misheard, so
            // matching against all alternatives makes the check more forgiving.
            this.recognition.maxAlternatives = 5;
            this.isSupported = true;
        }
    }

    start(onResult, onError) {
        if (!this.isSupported) {
            onError('Speech recognition not supported in this browser.');
            return;
        }

        this.recognition.onresult = (event) => {
            // Pass back every alternative the recognizer offers.
            const transcripts = Array.from(event.results[0], alt => alt.transcript);
            onResult(transcripts);
        };

        this.recognition.onerror = (event) => {
            onError(event.error);
        };

        try {
            this.recognition.start();
        } catch (e) {
            onError(e.message);
        }
    }

    stop() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }
}
