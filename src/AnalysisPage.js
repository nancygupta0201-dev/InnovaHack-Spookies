import useVantaHalo from "./useVantaHalo";

function average(arr, key) {
  if (!arr.length) return 0;
  return arr.reduce((acc, item) => acc + (item[key] ?? 0), 0) / arr.length;
}

export default function AnalysisPage({ setPage, answerAnalyses = [] }) {
  const vantaRef = useVantaHalo();

  const avgScore = average(answerAnalyses, "score");
  const avgConfidence = average(answerAnalyses, "confidence_score");
  const avgFluency = average(answerAnalyses, "fluency_score");
  const overallScore = Math.round(avgScore * 10); // backend score is /10, display as /100

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div ref={vantaRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }} className="min-h-screen px-6 py-16">
        <h1 className="text-3xl font-semibold text-white mb-10 text-center">Interview Analysis</h1>

        <div className="max-w-3xl mx-auto grid grid-cols-2 gap-6">

          {/* Overall score */}
          <div className="col-span-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 text-center">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Overall score</p>
            <p className="text-5xl font-semibold text-white">{overallScore}<span className="text-2xl text-white/50">/100</span></p>
          </div>

          {/* Confidence */}
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Confidence</p>
            <p className="text-2xl font-semibold text-white mb-2">{Math.round(avgConfidence * 10)}/100</p>
            <p className="text-sm text-white/70 leading-relaxed">Average confidence across all answers.</p>
          </div>

          {/* Fluency */}
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Fluency</p>
            <p className="text-2xl font-semibold text-white mb-2">{Math.round(avgFluency * 10)}/100</p>
            <p className="text-sm text-white/70 leading-relaxed">Average fluency across all answers.</p>
          </div>

          {/* Issues */}
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Issues</p>
            <ul className="text-sm text-white/70 leading-relaxed space-y-1">
              {answerAnalyses.flatMap((a) => a.issues ?? []).map((issue, i) => (
                <li key={i}>— {issue}</li>
              ))}
            </ul>
          </div>

          {/* Suggested fixes */}
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-5">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Suggested fixes</p>
            <ul className="text-sm text-white/70 leading-relaxed space-y-1">
              {answerAnalyses.filter((a) => a.possible_fix).map((a, i) => (
                <li key={i}>— {a.possible_fix}</li>
              ))}
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