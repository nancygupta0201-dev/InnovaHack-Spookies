import { useState } from "react";
import Headbar from "./Headbar";
import Home from "./Home";
import About from "./About";
import Interview from "./Interview";
import OngoingInterview from "./OngoingInterview";
import AnalysisPage from "./AnalysisPage";

export default function App() {
  const [page, setPage] = useState("home");
  const [analysisResult, setAnalysisResult] = useState(null);

  const PAGES = {
    home: (props) => <Home {...props} setAnalysisResult={setAnalysisResult} />,
    about: () => <About />,
    interview: (props) => <Interview {...props} analysisResult={analysisResult} />,
    ongoingInterview: (props) => <OngoingInterview {...props} />,
    analysisPage: (props) => <AnalysisPage {...props} />,
  };

  const PageComponent = PAGES[page] ?? PAGES.home;

  return (
    <div className="min-h-screen">
      <div style={{ position: "relative", zIndex: 10 }}>
        <Headbar page={page} setPage={setPage} />
      </div>
      <main>
        <PageComponent setPage={setPage} />
      </main>
    </div>
  );
}