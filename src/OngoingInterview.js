import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import useVantaHalo from "./useVantaHalo";
import useGestureCapture from "./useGestureCapture";
import useSpeechRecognition from "./useSpeechRecognition";

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function ScoreBar({ label, value }) {
  const pct = Math.round((value / 10) * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-white/50">
        <span>{label}</span>
        <span>{value}/10</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/10">
        <div
          className="h-1.5 rounded-full bg-white/70 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function OngoingInterview({
  setPage,
  sessionData,
  answerAnalyses = [],
  setAnswerAnalyses = () => {},
}) {
  const vantaRef = useVantaHalo();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const chatEndRef = useRef(null);
  const historyEndRef = useRef(null);
  const answerStartTime = useRef(null);
  const mediaStarted = useRef(false);

  const [showPopup, setShowPopup] = useState(true);
  const [mediaError, setMediaError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

  // history: [{question, answer, analysis}]
  const [history, setHistory] = useState([]);
  const [pendingQuestion, setPendingQuestion] = useState(
    sessionData?.firstQuestion || null
  );

  const [transcript, setTranscript] = useState(() =>
    sessionData?.firstQuestion
      ? [{ role: "interviewer", text: sessionData.firstQuestion }]
      : []
  );

  const [messages, setMessages] = useState([
    { from: "ai", text: "Give your answer here." }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { startGestureCapture, stopGestureCapture } = useGestureCapture();

  const { start: startListening, stop: stopListening, isListening, transcript: liveTranscript } = useSpeechRecognition({
    onResult: () => {},
  });

  const startMedia = async () => {
    if (mediaStarted.current) return;
    mediaStarted.current = true;
    setShowPopup(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
      answerStartTime.current = performance.now();
      await startGestureCapture(videoRef.current);
      startListening();
    } catch (err) {
      setMediaError("Could not access camera or microphone. Please check your permissions.");
    }
  };

  // Live speech → transcript panel
  useEffect(() => {
    if (!isListening || !liveTranscript) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "user" && last?.pending) {
        return [...prev.slice(0, -1), { role: "user", text: liveTranscript, pending: true }];
      }
      return [...prev, { role: "user", text: liveTranscript, pending: true }];
    });
  }, [liveTranscript, isListening]);

  const sendAnswer = async (answerText) => {
    if (!sessionData?.sessionId || !answerText.trim()) return;
    setIsSending(true);

    const gestureData = stopGestureCapture();
    const responseTime = (performance.now() - answerStartTime.current) / 1000;
    const questionForThisTurn = pendingQuestion;

    // Finalise pending transcript entry
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last?.pending) {
        return [...prev.slice(0, -1), { role: "user", text: answerText }];
      }
      return [...prev, { role: "user", text: answerText }];
    });

    try {
      const formData = new FormData();
      formData.append("session_id", sessionData.sessionId);
      formData.append("answer", answerText);
      formData.append("response_time_seconds", responseTime.toFixed(2));
      formData.append("gesture_data", JSON.stringify(gestureData));

      const res = await fetch("http://localhost:8000/agent_reply", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      const analysis = data.answer_analysis || null;

      // Push to history
      setHistory((prev) => [
        ...prev,
        { question: questionForThisTurn, answer: answerText, analysis },
      ]);

      if (analysis) {
        setAnswerAnalyses((prev) => [
          ...prev,
          { ...analysis, turn: questionCount + 1 },
        ]);
      }

      if (data.next_question) {
        setPendingQuestion(data.next_question);
        setTranscript((prev) => [...prev, { role: "interviewer", text: data.next_question }]);
        setQuestionCount((prev) => prev + 1);
        answerStartTime.current = performance.now();
        await startGestureCapture(videoRef.current);
        startListening();
      }
    } catch (err) {
      console.error("Failed to send answer:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitResponse = () => {
    const answer = liveTranscript?.trim();
    if (!answer) return;
    stopListening();
    sendAnswer(answer);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    await sendAnswer(text);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>

      <div ref={vantaRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }} className="min-h-screen flex flex-col px-6 py-16">

        {/* Camera permission popup — only shown once */}
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
            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 text-sm text-white/80 leading-relaxed overflow-y-auto flex flex-col gap-3" style={{ maxHeight: "70vh" }}>
              {transcript.length === 0 ? (
                <p className="text-white/30">Transcript will appear here...</p>
              ) : (
                transcript.map((entry, i) => (
                  <div key={i}>
                    <span className="text-xs uppercase tracking-wide text-white/40 block mb-1">
                      {entry.role === "interviewer" ? "Interviewer" : "You"}
                    </span>
                    <p className={entry.pending ? "text-white/40 italic" : ""}>{entry.text}</p>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={handleSubmitResponse}
              disabled={isSending || !liveTranscript?.trim()}
              className="w-full h-10 rounded-md text-sm font-medium bg-white text-stone-900 hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSending ? "Sending..." : "Submit response"}
            </button>
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
              onClick={async () => {
                if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
                if (timerRef.current) clearInterval(timerRef.current);
                stopListening();
                stopGestureCapture();
                setPage("analysisPage");
              }}
              className="mt-2 px-6 h-10 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              End interview
            </button>

            {/* Stats + chat below video */}
            <div className="w-full flex gap-6 text-center justify-center">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Total time</p>
                <p className="text-white/70 text-sm tracking-widest font-mono">{formatTime(elapsed)}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Questions</p>
                <p className="text-white/70 text-sm tracking-widest font-mono">{questionCount}</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen((prev) => !prev)}
              className="w-full px-6 h-10 rounded-md text-sm font-medium bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              Chat
            </button>

            {chatOpen && (
              <div className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm flex flex-col overflow-hidden" style={{ height: "280px" }}>
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                  <span className="text-sm font-medium text-white">Chat</span>
                  <button onClick={() => setChatOpen(false)}>
                    <X size={16} className="text-white/50 hover:text-white" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
                  {messages.map((msg, i) => (
                    <div key={i} className={`text-sm px-3 py-2 rounded-lg max-w-[85%] ${msg.from === "user" ? "bg-white text-stone-900 self-end" : "bg-white/20 text-white self-start"}`}>
                      {msg.text}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={isSending ? "Waiting for response..." : "Type your answer..."}
                    disabled={isSending}
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none disabled:opacity-50"
                  />
                  <button onClick={sendMessage} disabled={isSending}>
                    <Send size={16} className="text-white/50 hover:text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right — Q&A history cards */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-white/70 uppercase tracking-wide">History</h2>
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: "75vh" }}>
              {history.length === 0 ? (
                <p className="text-white/30 text-sm">Your Q&amp;A history will appear here after each answer.</p>
              ) : (
                history.map((item, i) => (
                  <div key={i} className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 flex flex-col gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/40 mb-1">Q{i + 1}</p>
                      <p className="text-sm text-white leading-relaxed">{item.question}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/40 mb-1">Your answer</p>
                      <p className="text-sm text-white/70 leading-relaxed">{item.answer}</p>
                    </div>
                    {item.analysis && (
                      <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
                        <ScoreBar label="Score" value={item.analysis.score} />
                        <ScoreBar label="Confidence" value={item.analysis.confidence_score} />
                        <ScoreBar label="Fluency" value={item.analysis.fluency_score} />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={historyEndRef} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}