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
import pencil from "../../assets/images/pencil.png";

const monthsInChinese = {
  January: "一月",
  February: "二月",
  March: "三月",
  April: "四月",
  May: "五月",
  June: "六月",
  July: "七月",
  August: "八月",
  September: "九月",
  October: "十月",
  November: "十一月",
  December: "十二月",
};

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
          className={`relative w-full flex justify-center items-center rounded-lg lg:rounded-xl h-16 lg:h-28 cursor-pointer transition duration-300 hover:shadow-lg bg-opacity-90 ${
            !isSameMonth(currentDay, currentDate) ? "bg-brown" : "bg-light-beige "
          }`}
        >
          <div className="absolute top-2 left-2 lg:left-4 text-xs md:text-base xl:text-xl font-bold text-dark-brown">
            {format(currentDay, "d")}
          </div>

          {/* 如果這天有日記，顯示相應的情緒圖片 */}
          {diaryForDay && diaryForDay.mood && (
            <div className="flex flex-col items-center mt-2 sm:mt-0">
              <img
                src={moodIcons[diaryForDay.mood]}
                className="h-8 w-8  sm:w-10 sm:h-10 md:h-12 md:w-12 lg:h-20 lg:w-20 lg:m-1"
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

  const handleWheel = (e) => {
    if (throttleTimeout.current === null) {
      if (e.deltaY > 0) {
        nextMonth();
      } else if (e.deltaY < 0) {
        prevMonth();
      }
      throttleTimeout.current = setTimeout(() => {
        throttleTimeout.current = null;
      }, 300);
    }
  };

  const formattedMonth = format(currentDate, "MMMM");
  const year = format(currentDate, "yyyy");
  const monthInChinese = monthsInChinese[formattedMonth];

  return (
    <div className="flex flex-col min-h-screen overflow-y-auto">
      {/* Sidebar */}
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div className="flex-grow p-4 lg:p-16 bg-back">
        <div className="flex items-center justify-between mb-6">
          {/* 左側的 menu icon */}
          <div className="flex-none">
            <TiThMenu
              className="h-6 w-6 lg:h-8 lg:w-8 cursor-pointer text-dark-blue hover:text-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
          </div>

          {/* 中間的年份和月份 */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={prevMonth}
              className="mr-4 text-dark-blue hover:text-dark-blue transition duration-300"
            >
              <FiChevronLeft className="h-6 w-6" />
            </button>
            <div className="w-36 lg:w-48 text-center ">
              <h2 className="text-lg lg:text-2xl xl:text-3xl font-bold text-dark-blue">
                {formattedMonth}
                <br />
                {monthInChinese} {year}
              </h2>
            </div>
            <button
              onClick={nextMonth}
              className="text-dark-blue hover:text-dark-blue transition duration-300"
            >
              <FiChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Spotify 按鈕 */}
          <div className="flex-none">
            {!spotifyToken ? (
              <button
                className="flex bg-gradient-to-tl from-[#33a9a0] to-[#c4e81d]  text-white text-sm lg:text-lg p-1 lg:px-4 lg:py-2 rounded-lg items-center"
                onClick={handleSpotifyLogin}
              >
                連結 <FaSpotify className="ml-2 text-white w-4 h-4 xl:w-6 xl:h-6" />
              </button>
            ) : (
              <button className="flex bg-gradient-to-r from-[#35ce75] to-[#e5f046] text-white px-2 py-2 rounded-lg items-center text-base lg:text-xl">
                已連結
                <FaSpotify className="ml-2 text-white xl:w-6 xl:h-6" />
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-4 text-center">
          {["週日", "週一", "週二", "週三", "週四", "週五", "週六"].map((day) => (
            <div
              key={day}
              className={`text-sm lg:text-2xl font-semibold ${
                day === "週六" || day === "週日" ? "text-red-400" : "text-dark-blue"
              }`}
            >
              {day}
            </div>
          ))}
        </div>
        {/* 日曆 */}
        <div
          className="grid grid-cols-7 gap-y-4 gap-x-2 md:gap-2 lg:gap-4 text-center mt-2"
          onWheel={handleWheel}
        >
          {renderDays()}
        </div>{" "}
        <div className="flex justify-center items-center mt-8">
          <img src={pencil} className="w-3/4"></img>
        </div>
      </div>
    </div>
  );
}

export default DiaryCalendar;
