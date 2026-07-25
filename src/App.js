import { useState } from "react";
import Headbar from "./Headbar";
import Home from "./Home";
import About from "./About";
import Interview from "./Interview";
import OngoingInterview from "./OngoingInterview";
import AnalysisPage from "./AnalysisPage";

const PAGES = {
  home: (props) => <Home {...props} />,
  about: () => <About />,
  interview: (props) => <Interview {...props} />,
  ongoingInterview: (props) => <OngoingInterview {...props} />,
  analysisPage: (props) => <AnalysisPage {...props} />,
};

export default function App() {
  const [page, setPage] = useState("home");

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