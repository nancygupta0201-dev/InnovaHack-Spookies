import useVantaHalo from "./useVantaHalo";

export default function About() {
  const vantaRef = useVantaHalo();

  return (
    <div ref={vantaRef} className="min-h-screen px-6 py-16 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-semibold text-white mb-3">About</h1>
      <p className="text-white/70 leading-relaxed max-w-xl text-center">
        A FastAPI backend that takes a candidate's CV (PDF), analyzes it against a job title, then conducts a multi-turn AI-driven interview — asking follow-up questions based on how the candidate answers, factoring in response time and webcam-derived gesture/emotion signals.
        Built on Google ADK (Agent Development Kit) Workflow/node primitives, with Gemini-backed LlmAgents for CV analysis, answer analysis, and question generation.
        Made By- Ravi Prakash Nag and Nancy Gupta. For more information, please visit our GitHub repository.
      </p>
    </div>
  );
}