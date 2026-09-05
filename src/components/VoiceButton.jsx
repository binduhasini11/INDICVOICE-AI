import { useState } from "react";

function VoiceButton({ onTranscript, disabled = false }) {
  const [listening, setListening] = useState(false);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      console.warn("Speech recognition is not supported in this browser.");
      onTranscript("Chennai la irundhu Bangalore ku naalaiku morning cheap-a train paathu sollu");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;

      onTranscript(text);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  return (
    <button
      className={`voice-button ${listening ? "listening" : ""}`}
      onClick={startListening}
      disabled={disabled}
    >
      <span className="mic-icon">
        {listening ? "🔴" : "🎙️"}
      </span>

      <span>
        {listening ? "Listening..." : "Speak your request"}
      </span>
    </button>
  );
}

export default VoiceButton;