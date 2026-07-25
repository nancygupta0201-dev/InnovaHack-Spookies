import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import useVantaHalo from "./useVantaHalo";

const DEMO_TRANSCRIPT = `Interviewer: Hello! Welcome to your AI interview session. Can you start by introducing yourself?

You: Sure! My name is John Doe. I'm a third-year computer science student with experience in full-stack development and machine learning.

Interviewer: Great! Can you tell me about a challenging project you've worked on recently?

You: I recently built a real-time collaborative code editor using React and WebSockets. The biggest challenge was handling conflict resolution when multiple users edited the same line simultaneously.

Interviewer: Interesting. How did you approach that problem?

You: I implemented an operational transformation algorithm to merge concurrent edits without data loss. It took a few iterations but worked well in the end.`;

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function OngoingInterview({ setPage }) {
  const vantaRef = useVantaHalo();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [showPopup, setShowPopup] = useState(true);
  const [mediaError, setMediaError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const startMedia = async () => {
    setShowPopup(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setMediaError("Could not access camera or microphone. Please check your permissions.");
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>

      {/* Vanta background — fixed behind everything */}
      <div ref={vantaRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }} />

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 1 }} className="min-h-screen flex flex-col px-6 py-16">

        {/* Recording alert popup */}
        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-white rounded-xl p-8 max-w-sm mx-4 text-left">
              <h2 className="text-lg font-semibold text-stone-900 mb-2">You are being recorded</h2>
              <p className="text-sm text-stone-600 leading-relaxed mb-6">
                This interview session will use your camera and microphone. By continuing, you consent to being recorded for the duration of the interview.
              </p>
              <button
                onClick={startMedia}
                className="w-full h-10 rounded-md text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors"
              >
                I understand, continue
              </button>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-semibold text-white mb-8 text-center">Ongoing Interview</h1>

        <div className="flex-1 grid grid-cols-3 gap-6">

          {/* Left — Transcript */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-white/70 uppercase tracking-wide">Transcript</h2>
            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 text-sm text-white/80 leading-relaxed whitespace-pre-line overflow-y-auto" style={{ maxHeight: "70vh" }}>
              {DEMO_TRANSCRIPT}
            </div>
          </div>

          {/* Middle — Live video + End button */}
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-sm font-medium text-white/70 uppercase tracking-wide">You</h2>
            <div className="w-full rounded-xl overflow-hidden border border-white/20 bg-white/10" style={{ minHeight: "300px" }}>
              {mediaError ? (
                <p className="text-red-400 text-sm p-4 text-center">{mediaError}</p>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
            </div>
            <button
              onClick={() => {
                if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
                if (timerRef.current) clearInterval(timerRef.current);
                setPage("analysisPage");
              }}
              className="mt-2 px-6 h-10 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              End interview
            </button>
          </div>

          {/* Right — Image/GIF placeholder */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-white/70 uppercase tracking-wide">Interviewer</h2>
            <div className="w-full rounded-xl border border-dashed border-white/30 bg-white/10 flex items-center justify-center" style={{ minHeight: "300px" }}>
              <ImageIcon size={40} className="text-white/40" />
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Total time</p>
                <p className="text-white/70 text-sm tracking-widest font-mono">{formatTime(elapsed)}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Total questions</p>
                <p className="text-white/70 text-sm tracking-widest font-mono">0</p>
              </div>
            </div>
            <button className="mt-2 px-6 h-10 rounded-md text-sm font-medium bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors">
              Chat
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}