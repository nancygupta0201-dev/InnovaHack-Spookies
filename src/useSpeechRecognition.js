import { useRef, useState } from "react";

export default function useSpeechRecognition({ onResult }) {
  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);

  const start = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("SpeechRecognition not supported in this browser.");
      setError("not-supported");
      return;
    }

    manualStopRef.current = false;
    setError(null);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript((finalTranscript + interim).trim());
    };

    recognition.onerror = (e) => {
      console.error("SpeechRecognition error:", e.error);
      setError(e.error); // e.g. "not-allowed", "audio-capture", "aborted"
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!manualStopRef.current) {
        try {
          recognition.start();
          return;
        } catch (err) {
          console.error("Failed to auto-restart recognition:", err);
          setError("restart-failed");
        }
      }
      setIsListening(false);
      const trimmed = finalTranscript.trim();
      if (trimmed) onResult(trimmed);
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      // Most common case: a previous recognition instance hasn't fully
      // released the mic yet (InvalidStateError). Retry once, shortly.
      console.error("recognition.start() threw:", err);
      setTimeout(() => {
        try {
          recognition.start();
          setIsListening(true);
        } catch (err2) {
          setError("start-failed");
        }
      }, 400);
    }
  };

  const stop = () => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const reset = () => setTranscript("");

  return { start, stop, isListening, transcript, reset, error };
}