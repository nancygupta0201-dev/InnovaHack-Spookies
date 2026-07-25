import useVantaHalo from "./useVantaHalo";

function Pill({ children }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-white/80">
      {children}
    </span>
  );
}

function FitScoreRing({ value }) {
  if (value === null || value === undefined) return null;
  const pct = Math.round((value / 10) * 100);
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg"
        style={{
          background: `conic-gradient(rgba(255,255,255,0.85) ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
        }}
      >
        <div className="w-12 h-12 rounded-full bg-stone-900/80 flex items-center justify-center">
          {value}
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-wide text-white/40">Fit / 10</span>
    </div>
  );
}

function CVSummaryCard({ cvAnalysis }) {
  if (!cvAnalysis) return null;

  const {
    name,
    email,
    phone,
    total_years_experience,
    skills = [],
    education = [],
    work_history = [],
    summary,
    fit_score,
    red_flags = [],
  } = cvAnalysis;

  return (
    <div className="w-full max-w-2xl rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{name || "Candidate"}</h2>
          <p className="text-xs text-white/50 mt-0.5">
            {[email, phone].filter(Boolean).join(" · ") || "No contact details found"}
          </p>
          {total_years_experience != null && (
            <p className="text-xs text-white/50 mt-1">
              {total_years_experience} {total_years_experience === 1 ? "year" : "years"} of experience
            </p>
          )}
        </div>
        <FitScoreRing value={fit_score} />
      </div>

      {summary && (
        <p className="text-sm text-white/80 leading-relaxed">{summary}</p>
      )}

      {skills.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40 mb-2">Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <Pill key={i}>{skill}</Pill>
            ))}
          </div>
        </div>
      )}

      {work_history.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40 mb-2">Work history</p>
          <ul className="text-sm text-white/70 leading-relaxed space-y-1">
            {work_history.map((entry, i) => (
              <li key={i}>— {entry}</li>
            ))}
          </ul>
        </div>
      )}

      {education.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40 mb-2">Education</p>
          <ul className="text-sm text-white/70 leading-relaxed space-y-1">
            {education.map((entry, i) => (
              <li key={i}>— {entry}</li>
            ))}
          </ul>
        </div>
      )}

      {red_flags.length > 0 && (
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs uppercase tracking-wide text-red-300/70 mb-2">Flagged for review</p>
          <ul className="text-sm text-red-200/80 leading-relaxed space-y-1">
            {red_flags.map((flag, i) => (
              <li key={i}>— {flag}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Interview({ setPage, sessionData }) {
  const vantaRef = useVantaHalo();

  return (
    <div ref={vantaRef} className="min-h-screen px-6 py-16">
      <h1 className="text-3xl font-semibold text-white mb-10 text-center">Interview</h1>

      <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
        <div className="w-full max-w-md rounded-lg overflow-hidden">
          <img src="/interviewimage.jpeg" alt="Interview" className="w-full h-auto object-contain" />
        </div>

        <CVSummaryCard cvAnalysis={sessionData?.cvAnalysis} />

        <button
          onClick={() => setPage("ongoingInterview")}
          className="px-4 h-10 rounded-md text-sm font-medium bg-white text-stone-900 hover:bg-white/90 transition-colors"
        >
          Start interview
        </button>
      </div>
    </div>
  );
}