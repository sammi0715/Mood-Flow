import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AppProvider } from "./AppContext";
import Community from "./pages/Community";
import DiaryCalendar from "./pages/Diary/DiaryCalendar";
import NewDiaryEntry from "./pages/Diary/NewDiaryEntry";
import SpotifyCallback from "./pages/Diary/SpotifyCallback";
import ViewDiaryEntry from "./pages/Diary/ViewDiaryEntry";
import Footer from "./pages/Footer";
import Header from "./pages/Header";
import HistoryReview from "./pages/HistoryReview";
import Home from "./pages/Home";
import MoodTrack from "./pages/MoodTrack";
import Settings from "./pages/Settings";
import { SpotifyPlayerProvider } from "./utils/SpotifyPlayerContext";
function App() {
  return (
    <Router>
      <AppProvider>
        <SpotifyPlayerProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/*" element={<Home />} />
            <Route path="/diary-calendar/:userId" element={<DiaryCalendar />} />
            <Route path="/spotify-callback" element={<SpotifyCallback />} />
            <Route path="/view-diary/:diaryId" element={<ViewDiaryEntry />} />
            <Route path="/new-diary-entry" element={<NewDiaryEntry />} />
            <Route path="/community/:userId" element={<Community />} />
            <Route path="/history-review/:userId" element={<HistoryReview />} />
            <Route path="/mood-track/:userId" element={<MoodTrack />} />
            <Route path="/settings/:userId" element={<Settings />} />
          </Routes>
          <Footer />
        </SpotifyPlayerProvider>
      </AppProvider>
    </Router>
  );
}

export default App;
