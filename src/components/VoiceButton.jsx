import { useState, useRef, useEffect } from "react";
import { transcribeAudio } from "../api";

function VoiceButton({ onTranscript, disabled = false, size = "large", onStateChange }) {
  const [listening, setListening] = useState(false);
  const [statusText, setStatusText] = useState("");
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange(listening);
    }
  }, [listening, onStateChange]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setListening(false);
    setStatusText("");
  };

  const startFallbackAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatusText("Microphone not available");
        setTimeout(() => setStatusText(""), 3000);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setListening(false);
        if (audioChunksRef.current.length > 0) {
          setStatusText("Understanding speech...");
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
            const result = await transcribeAudio(audioBlob);
            if (result && result.transcript) {
              onTranscript(result.transcript);
            }
          } catch (err) {
            console.warn("Backend audio transcription note:", err);
          } finally {
            setStatusText("");
          }
        }
      };

      mediaRecorder.start();
      setListening(true);
      setStatusText("Listening...");
    } catch (err) {
      console.warn("Audio recording access notice:", err);
      setListening(false);
      setStatusText("Microphone permission needed");
      setTimeout(() => setStatusText(""), 3000);
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      startFallbackAudioRecording();
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setListening(true);
        setStatusText("");
      };

      recognition.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const text = event.results[0][0].transcript;
          if (text && text.trim()) {
            onTranscript(text.trim());
          }
        }
      };

      recognition.onerror = (event) => {
        if (event.error === "aborted" || event.error === "no-speech") {
          setListening(false);
          return;
        }

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setStatusText("Microphone access blocked");
          setTimeout(() => setStatusText(""), 3500);
          setListening(false);
          return;
        }

        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn("Failed to initialize speech recognition:", err);
      startFallbackAudioRecording();
    }
  };

  const isCompact = size === "compact";

  return (
    <div className={`voice-control-wrap ${isCompact ? "compact" : "hero"}`}>
      <button
        type="button"
        id="voice-input-btn"
        className={`voice-btn ${listening ? "is-listening" : ""} ${isCompact ? "btn-compact" : "btn-hero"}`}
        onClick={toggleListening}
        disabled={disabled}
        aria-label={listening ? "Stop listening" : "Tap to speak in Tamil, Hindi, or English"}
        title={listening ? "Listening... click to finish" : "Tap to speak"}
      >
        <div className="voice-btn-inner">
          <svg className="mic-svg" width={isCompact ? "18" : "26"} height={isCompact ? "18" : "26"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
          </svg>
          {!isCompact && (
            <span className="voice-btn-label">
              {listening ? "Listening..." : "Tap to speak"}
            </span>
          )}
        </div>
      </button>

      {/* Minimalist acoustic waveform when listening */}
      {listening && (
        <div className="listening-wave-box" aria-live="polite">
          <span className="wave-bar bar-1"></span>
          <span className="wave-bar bar-2"></span>
          <span className="wave-bar bar-3"></span>
          <span className="wave-bar bar-4"></span>
          <span className="wave-bar bar-5"></span>
          <span className="wave-bar bar-6"></span>
          <span className="wave-bar bar-7"></span>
          <span className="listening-text">I'm listening...</span>
        </div>
      )}

      {statusText && !listening && (
        <span className="voice-status-notice">{statusText}</span>
      )}
    </div>
  );
}

export default VoiceButton;
