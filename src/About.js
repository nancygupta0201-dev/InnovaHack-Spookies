import useVantaHalo from "./useVantaHalo";

export default function About() {
  const vantaRef = useVantaHalo();

  return (
    <div ref={vantaRef} className="min-h-screen px-6 py-16 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-semibold text-white mb-3">About</h1>
      <p className="text-white/70 leading-relaxed max-w-xl text-center">
        This is the about page. Add your project description, team info, or
        whatever context belongs here.
      </p>
    </div>
  );
}