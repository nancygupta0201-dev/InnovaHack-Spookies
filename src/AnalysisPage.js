import useVantaHalo from "./useVantaHalo";

export default function AnalysisPage({ setPage }) {
  const vantaRef = useVantaHalo();

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div ref={vantaRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }} className="min-h-screen px-6 py-16">
        <h1 className="text-3xl font-semibold text-white mb-10 text-center">Interview Analysis</h1>

        <div className="max-w-3xl mx-auto grid grid-cols-2 gap-6">

          {/* Overall score */}
          <div className="col-span-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 text-center">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Overall score</p>
            <p className="text-5xl font-semibold text-white">78<span className="text-2xl text-white/50">/100</span></p>
          </div>

          {/* Communication */}
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Communication</p>
            <p className="text-2xl font-semibold text-white mb-2">82/100</p>
            <p className="text-sm text-white/70 leading-relaxed">Clear and structured responses. Could improve on conciseness in longer answers.</p>
          </div>

          {/* Technical knowledge */}
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Technical knowledge</p>
            <p className="text-2xl font-semibold text-white mb-2">75/100</p>
            <p className="text-sm text-white/70 leading-relaxed">Good grasp of core concepts. Some gaps in system design and scalability topics.</p>
          </div>

          {/* Strengths */}
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Strengths</p>
            <ul className="text-sm text-white/70 leading-relaxed space-y-1">
              <li>— Strong problem-solving approach</li>
              <li>— Good use of real-world examples</li>
              <li>— Confident delivery</li>
            </ul>
          </div>

          {/* Areas to improve */}
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Areas to improve</p>
            <ul className="text-sm text-white/70 leading-relaxed space-y-1">
              <li>— Be more concise under time pressure</li>
              <li>— Deeper knowledge of distributed systems</li>
              <li>— Ask clarifying questions before answering</li>
            </ul>
          </div>

        </div>

        <div className="max-w-3xl mx-auto mt-8 flex justify-center">
          <button
            onClick={() => setPage("interview")}
            className="px-6 h-10 rounded-md text-sm font-medium bg-white text-stone-900 hover:bg-white/90 transition-colors"
          >
            Retake interview
          </button>
        </div>
      </div>
    </div>
  );
}