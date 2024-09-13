import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import DiaryCalendar from "./pages/Diary/DiaryCalendar";
import NewDiaryEntry from "./pages/Diary/NewDiaryEntry";
import Community from "./pages/Community";
import HistoryReview from "./pages/HistoryReview";
import MoodTrack from "./pages/MoodTrack";
import Settings from "./pages/Settings";
import Header from "./pages/Header";
import Footer from "./pages/Footer";
function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/diary-calendar" element={<DiaryCalendar />} />
        <Route path="/new-diary-entry" element={<NewDiaryEntry />} />
        <Route path="/community" element={<Community />} />
        <Route path="/history-review" element={<HistoryReview />} />
        <Route path="/mood-track" element={<MoodTrack />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
