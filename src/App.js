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

  let content;
  switch (page) {
    case "home":
      content = <Home setPage={setPage} setSessionData={handleSetSessionData} />;
      break;
    case "about":
      content = <About />;
      break;
    case "interview":
      content = <Interview setPage={setPage} sessionData={sessionData} />;
      break;
    case "ongoingInterview":
      content = (
        <OngoingInterview
          setPage={setPage}
          sessionData={sessionData}
          answerAnalyses={answerAnalyses}
          setAnswerAnalyses={setAnswerAnalyses}
        />
      );
      break;
    case "analysisPage":
      content = <AnalysisPage setPage={setPage} answerAnalyses={answerAnalyses} />;
      break;
    default:
      content = <Home setPage={setPage} setSessionData={handleSetSessionData} />;
  }

  return (
    <div className="min-h-screen">
      <div style={{ position: "relative", zIndex: 10 }}>
        <Headbar page={page} setPage={setPage} />
      </div>
      <main>{content}</main>
    </div>
  );
}