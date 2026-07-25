import { useState } from "react";
import Headbar from "./Headbar";
import Home from "./Home";
import About from "./About";
import Interview from "./Interview";
import OngoingInterview from "./OngoingInterview";
import AnalysisPage from "./AnalysisPage";

export default function App() {
  const [page, setPage] = useState("home");
  const [sessionData, setSessionData] = useState(null);
  const [answerAnalyses, setAnswerAnalyses] = useState([]);

  const handleSetSessionData = (data) => {
    setAnswerAnalyses([]);
    setSessionData(data);
  };

  const PAGES = {
    home: (props) => <Home {...props} setSessionData={handleSetSessionData} />,
    about: () => <About />,
    interview: (props) => <Interview {...props} sessionData={sessionData} />,
    ongoingInterview: (props) => (
      <OngoingInterview
        {...props}
        sessionData={sessionData}
        answerAnalyses={answerAnalyses}
        setAnswerAnalyses={setAnswerAnalyses}
      />
    ),
    analysisPage: (props) => (
      <AnalysisPage {...props} answerAnalyses={answerAnalyses} />
    ),
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