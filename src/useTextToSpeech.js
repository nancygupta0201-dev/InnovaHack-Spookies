import { useRef, useCallback, useState } from "react";

export default function useTextToSpeech() {
  const voiceRef = useRef(null);
  const [rate, setRate] = useState(1); // 0.1 (slowest) to 10 (fastest); 1 = normal

  // Voices load asynchronously in some browsers — grab one when ready.
  const getVoice = useCallback(() => {
    if (voiceRef.current) return voiceRef.current;
    const voices = window.speechSynthesis.getVoices();
    // Prefer an English voice if available, otherwise just take the first one.
    voiceRef.current =
      voices.find((v) => v.lang?.startsWith("en")) || voices[0] || null;
    return voiceRef.current;
  }, []);

  const speak = useCallback(
    (text, overrideRate) => {
      if (!text || !("speechSynthesis" in window)) return;

      // Stop anything currently being said before starting the next line —
      // prevents overlapping/queued speech if a new question arrives quickly.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = overrideRate ?? rate;
      utterance.pitch = 1;

      window.speechSynthesis.speak(utterance);
    },
    [getVoice, rate]
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, stop, rate, setRate };
}