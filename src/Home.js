import { useRef, useState } from "react";
import { ImageIcon, Upload } from "lucide-react";
import useVantaHalo from "./useVantaHalo";

const STEPS = [
  {
    number: "01",
    title: "Upload your resume",
    description: "Upload your resume in PDF format. Our AI will analyze it and extract key information to personalize your interview experience.",
  },
  {
    number: "02",
    title: "Review the analysis",
    description: "Get a detailed breakdown of your resume — skills, experience, and areas to highlight during the interview.",
  },
  {
    number: "03",
    title: "Start your interview",
    description: "Begin an AI-powered mock interview tailored to your resume. Receive real-time feedback and a full analysis at the end.",
  },
];

async function sendToResumeAnalysisAgent(file) {
  console.log("Sending to resume analysis agent:", file.name);
}

export default function Home({ setPage }) {
  const vantaRef = useVantaHalo();
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState("idle");

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setStatus("error");
      return;
    }

    setStatus("sending");

    try {
      await sendToResumeAnalysisAgent(file);
      setPage("interview");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div ref={vantaRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }} className="min-h-screen px-6 py-16">

        {/* Tutorial heading */}
        <h1 className="text-3xl font-semibold text-white mb-2">Tutorial</h1>
        <p className="text-white/50 text-sm mb-10">Follow these steps to get started</p>

        {/* Steps */}
        <div className="flex flex-col gap-6 mb-16">
          {STEPS.map((step) => (
            <div key={step.number} className="flex gap-5 items-start rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-5">
              <span className="text-2xl font-semibold text-white/30 leading-none">{step.number}</span>
              <div>
                <h2 className="text-base font-medium text-white mb-1">{step.title}</h2>
                <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Image placeholder + Upload button side by side */}
        <div className="flex items-center gap-8">
          <div className="w-48 shrink-0 rounded-xl overflow-hidden">
            <img src="/resumeimage.avif" alt="Resume" className="w-full h-auto object-contain" />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-white/70 text-sm leading-relaxed">
              Ready to get started? Upload your resume and let the AI do the rest.
            </p>
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-2 px-4 h-10 rounded-md text-sm font-medium bg-white text-stone-900 hover:bg-white/90 transition-colors w-fit"
            >
              <Upload size={16} />
              {status === "sending" ? "Sending…" : "Upload resume"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-400">Please upload a PDF file.</p>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

      </div>
    </div>
  );
}