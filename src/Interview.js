import { ImageIcon } from "lucide-react";
import useVantaHalo from "./useVantaHalo";

const DEMO_ANALYSIS = `Name: John Doe
Experience: 3 years

Skills: React, Node.js, Python, SQL

Strengths:
- Strong frontend experience
- Good problem-solving track record
- Multiple internship projects

Suggestions:
- Add more quantifiable achievements
- Expand on leadership experience
- Include open source contributions`.trim();

export default function Interview({ setPage }) {
  const vantaRef = useVantaHalo();

  return (
    <div ref={vantaRef} className="min-h-screen px-6 py-16">
      <h1 className="text-3xl font-semibold text-white mb-10 text-center">Interview</h1>

      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-10 items-start">
        {/* Left — Start interview */}
        <div className="flex flex-col items-center gap-4 mt-10">
          <div className="w-full rounded-lg overflow-hidden">
            <img src="/interviewimage.jpeg" alt="Interview" className="w-full h-auto object-contain" />
          </div>
          <button
            onClick={() => setPage("ongoingInterview")}
            className="px-4 h-10 rounded-md text-sm font-medium bg-white text-stone-900 hover:bg-white/90 transition-colors"
          >
            Start interview
          </button>
        </div>

        {/* Right — Resume analysis output */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-white">Resume analysis</h2>
          <div className="flex-1 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-5 text-sm text-white/80 leading-relaxed whitespace-pre-line">
            {DEMO_ANALYSIS}
          </div>
        </div>
      </div>
    </div>
  );
}