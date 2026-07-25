import useVantaHalo from "./useVantaHalo";

export default function Interview({ setPage }) {
  const vantaRef = useVantaHalo();

  return (
    <div ref={vantaRef} className="min-h-screen px-6 py-16">
      <h1 className="text-3xl font-semibold text-white mb-10 text-center">Interview</h1>

      <div className="max-w-4xl mx-auto flex justify-center">
        <div className="flex flex-col items-center gap-4">
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
      </div>
    </div>
  );
}