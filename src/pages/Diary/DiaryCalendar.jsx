import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchDiaries, fetchUserData } from "../../utills/firebase-data";
import { TiThMenu } from "react-icons/ti";
import { FaSpotify } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useSpotifyPlayer } from "../../utills/SpotifyPlayerContext";
import moodIcons from "../../utills/moodIcons";
import Sidebar from "../Sidebar";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from "date-fns";

function DiaryCalendar() {
  const { userId } = useParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaries, setDiaries] = useState([]);
  const navigate = useNavigate();
  const throttleTimeout = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { spotifyToken, handleSpotifyLogin } = useSpotifyPlayer();

  useEffect(() => {
    const loadDiaries = async () => {
      try {
        const diaryData = await fetchDiaries(userId);
        console.log("Fetched Diaries:", diaryData);
        setDiaries(diaryData);
      } catch (error) {
        console.error("Error loading diaries: ", error);
        alert(`加載日記時出錯：${error.message}`);
      }
    };

    if (userId) {
      loadDiaries();
    } else {
      console.warn("User ID is undefined.");
      alert("用戶ID未定義，無法加載日記。");
    }
  }, [userId]);

  const handleDateClick = (day) => {
    const today = new Date();
    const formattedDate = format(day, "yyyy-MM-dd");

    // 禁止點擊未來日期
    if (day > today) {
      alert("時間還沒到喔😗～");
      return;
    }

    const diaryForDay = diaries.find((diary) => isSameDay(new Date(diary.date), day));

    if (diaryForDay) {
      navigate(`/view-diary/${diaryForDay.id}`);
    } else {
      navigate(`/new-diary-entry?date=${formattedDate}`);
    }
  };
  const renderDays = () => {
    const startOfTheMonth = startOfMonth(currentDate);
    const endTheMonth = endOfMonth(currentDate);
    const startDate = startOfWeek(startOfTheMonth);
    const endDate = endOfWeek(endTheMonth);
    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const currentDay = day;

      const diaryForDay = diaries.find((diary) => isSameDay(new Date(diary.date), currentDay));
      days.push(
        <div
          key={currentDay.getTime()}
          onClick={() => handleDateClick(new Date(currentDay))}
          className={`relative border-2 border-gray-200 rounded-[5px] h-16 lg:h-28 cursor-pointer ${
            !isSameMonth(currentDay, currentDate) ? "bg-gray-100" : ""
          }`}
        >
          <div className="absolute top-1 left-1 text-xs lg:text-sm font-bold">
            {format(currentDay, "d")}
          </div>
          {/* 如果這天有日記，顯示相應的情緒圖片 */}
          {diaryForDay && diaryForDay.mood && (
            <div className="flex flex-col items-center mt-4">
              <img
                src={moodIcons[diaryForDay.mood]}
                className="h-8 w-8 lg:h-20 lg:w-20 mb-1"
                alt={diaryForDay.mood}
                title={diaryForDay.mood}
              />
            </div>
          )}
        </div>
      );
      day = addDays(day, 1);
    }
    return days;
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // 處理滾輪事件，根據滾動方向切換月份
  const handleWheel = (e) => {
    if (throttleTimeout.current === null) {
      if (e.deltaY > 0) {
        nextMonth();
      } else if (e.deltaY < 0) {
        prevMonth();
      }
      // 設置節流時間
      throttleTimeout.current = setTimeout(() => {
        throttleTimeout.current = null;
      }, 300);
    }
    console.log("Current Date:", currentDate);
  };

  return (
    <div className="flex h-full overflow-y-auto">
      {/* Sidebar */}
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div className="flex-1 p-4 h-screen">
        <div className="flex items-center justify-between mb-6">
          {/* 左側的 menu icon */}
          <div className="flex-none">
            <TiThMenu
              className="h-6 w-6 lg:h-8 lg:w-8 cursor-pointer text-gray-600 hover:text-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
          </div>

          {/* 中間的年份和月份 */}
          <div className="text-center flex items-center justify-centers">
            <button onClick={prevMonth} className="lg:mr-8">
              <FiChevronLeft className="h-6 w-6 text-gray-500 hover:text-gray-700" />
            </button>
            <div className="w-36 lg:w-48">
              <h2 className="text-lg lg:text-2xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
            </div>
            <button onClick={nextMonth} className="lg:ml-8">
              <FiChevronRight className="h-6 w-6 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          {/* Spotify 按鈕 */}
          <div className="flex-none">
            {!spotifyToken ? (
              <button
                className="flex bg-green-500 text-white px-2 py-1 items-center rounded-lg "
                onClick={handleSpotifyLogin}
              >
                <p className="text-sm">連結</p>
                <FaSpotify className="ml-2" />
              </button>
            ) : (
              <button className=" flex bg-green-500 text-white px-2 py-2 rounded-lg items-center">
                已連結
                <FaSpotify className="ml-2" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 text-center">
          {["週日", "週一", "週二", "週三", "週四", "週五", "週六"].map((day) => (
            <div key={day} className="text-sm lg:text-xl text-gray-600 font-semibold">
              {day}
            </div>
          ))}
        </div>

        {/* 日曆 */}
        <div className="grid grid-cols-7  gap-2 lg:gap-4 text-center mt-2" onWheel={handleWheel}>
          {renderDays()}
        </div>
      </div>
    </div>
  );
}

export default DiaryCalendar;
