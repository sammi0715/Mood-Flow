import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import DiaryCalendar from "./pages/Diary/DiaryCalendar";
import NewDiaryEntry from "./pages/Diary/NewDiaryEntry";
import Community from "./pages/Community";
import HistoryReview from "./pages/HistoryReview";
import MoodTrack from "./pages/MoodTrack";
import Settings from "./pages/Settings";
import Header from "./pages/Header";
import Footer from "./pages/Footer";
import ViewDiaryEntry from "./pages/Diary/ViewDiaryEntry";
import SpotifyCallback from "./pages/Diary/SpotifyCallback";
import { SpotifyPlayerProvider } from "./utills/SpotifyPlayerContext";

function App() {
  return (
    <Router>
      <SpotifyPlayerProvider>
        <div className="flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/diary-calendar/:userId" element={<DiaryCalendar />} />
              <Route path="/spotify-callback" element={<SpotifyCallback />} />
              <Route path="/view-diary/:diaryId" element={<ViewDiaryEntry />} />
              <Route path="/new-diary-entry" element={<NewDiaryEntry />} />
              <Route path="/community/:userId" element={<Community />} />
              <Route path="/history-review/:userId" element={<HistoryReview />} />
              <Route path="/mood-track/:userId" element={<MoodTrack />} />
              <Route path="/settings/:userId" element={<Settings />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </SpotifyPlayerProvider>
    </Router>
  );
}

export default App;
