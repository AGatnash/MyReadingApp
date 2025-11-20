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
            this.isSupported = true;
        }
    }

    start(onResult, onError) {
        if (!this.isSupported) {
            onError('Speech recognition not supported in this browser.');
            return;
        }

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
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
