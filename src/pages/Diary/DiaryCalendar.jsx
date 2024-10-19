import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import { FaSpotify } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { TiThMenu } from "react-icons/ti";
import { useNavigate, useParams } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import pencil from "../../assets/images/pencil.png";
import Alert from "../../components/alert";
import { useSpotifyPlayer } from "../../utils/SpotifyPlayerContext";
import { fetchDiaries } from "../../utils/firebase-data";
import moodIcons from "../../utils/moodIcons";
import Sidebar from "../Sidebar";
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaries, setDiaries] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertConfirm, setAlertConfirm] = useState(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const { userId } = useParams();
  const navigate = useNavigate();
  const throttleTimeout = useRef(null);
  const { spotifyToken, handleSpotifyLogin } = useSpotifyPlayer();

  useEffect(() => {
    if (!localStorage.getItem("visited")) {
      setIsFirstVisit(true);
      localStorage.setItem("visited", "true");
    }
  }, []);

  useEffect(() => {
    const loadDiaries = async () => {
      try {
        const diaryData = await fetchDiaries(userId);
        setDiaries(diaryData);
      } catch (error) {
        console.error("Error loading diaries: ", error);
        setAlertMessage(`加載日記時出錯：${error.message}`);
        navigate("/");
      }
    };

    if (userId) {
      loadDiaries();
    } else {
      console.warn("User ID is undefined.");
      setAlertMessage("用戶ID未定義，無法加載日記。");
      navigate("/");
    }
  }, [userId]);

  const handleDateClick = (day) => {
    const today = new Date();
    const formattedDate = format(day, "yyyy-MM-dd");

    if (day > today) {
      setAlertMessage("時間還沒到喔 😗 ～");
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
    const today = new Date();
    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const currentDay = day;

      const diaryForDay = diaries.find((diary) => isSameDay(new Date(diary.date), currentDay));
      const isToday = isSameDay(today, currentDay);

      days.push(
        <div
          key={currentDay.getTime()}
          onClick={() => handleDateClick(new Date(currentDay))}
          className={`relative w-full flex justify-center items-center rounded-lg lg:rounded-xl h-16 lg:h-28 cursor-pointer transition duration-300 bg-opacity-90 hover:shadow-lg ho ${
            !isSameMonth(currentDay, currentDate) ? "bg-brown" : "bg-light-beige "
          }`}
        >
          <div
            className={`absolute top-2 left-2 lg:left-4 text-xs md:text-base xl:text-xl text-dark-brown 
            ${
              isToday
                ? "bg-dark-orange text-white rounded-full w-4 h-4 xl:w-8 xl:h-8 md:w-6 md:h-6"
                : ""
            }`}
          >
            {format(currentDay, "d")}
          </div>

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
    e.stopPropagation();

    if (throttleTimeout.current === null) {
      const absDeltaX = Math.abs(e.deltaX);
      const absDeltaY = Math.abs(e.deltaY);

      if (absDeltaX > 3 * absDeltaY && absDeltaX > 0.5) {
        if (e.deltaX < 0) {
          prevMonth();
        } else if (e.deltaX > 0) {
          nextMonth();
        }
        throttleTimeout.current = setTimeout(() => {
          throttleTimeout.current = null;
        }, 300);
      }
    }
  };

  const formattedMonth = format(currentDate, "MMMM");
  const year = format(currentDate, "yyyy");
  const monthInChinese = monthsInChinese[formattedMonth];

  return (
    <div className="relative">
      {isFirstVisit && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-10/12 md:w-1/2 lg:w-1/2 text-center">
            <h2 className="text-xl font-bold mb-4">歡迎來到Mood Flow！</h2>
            <p className="mb-4">你可以點擊月曆上現在以及過去的任一天來新增你的日記 📒</p>
            <p className="mb-4">如果你有Spotify帳戶，點擊右上角連結按鈕開始選歌吧！</p>
            <p className="mb-4">點擊左上角選單發現更多功能！</p>
            <button
              className="px-4 py-2 bg-light-orange text-white rounded hover:bg-dark-orange"
              onClick={() => setIsFirstVisit(false)}
            >
              開始使用
            </button>
          </div>
        </div>
      )}
      <div className="flex  min-h-screen">
        {/* Sidebar */}
        <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

        <div className="flex-grow flex-col p-4  bg-back">
          <div className="flex items-center justify-between mb-4">
            {/* 左側的 menu icon */}
            <div className="flex-none">
              <TiThMenu
                className="h-6 w-6 lg:h-8 lg:w-8 cursor-pointer text-dark-blue hover:text-gray-800"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
            </div>

            {/* 中間的年份和月份 */}
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={prevMonth}
                className="mr-4 text-dark-blue hover:text-dark-blue transition duration-300"
              >
                <FiChevronLeft className="h-6 w-6" />
              </button>
              <div className="w-36 lg:w-48 text-center ">
                <h2 className="text-lg lg:text-2xl xl:text-3xl text-dark-blue">
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
                <>
                  <button
                    className="flex bg-gradient-to-tl from-[#33a9a0] to-[#c4e81d]  text-white text-sm lg:text-lg p-1 lg:px-4 lg:py-2 rounded-lg items-center"
                    onClick={handleSpotifyLogin}
                    data-tooltip-id="spotify-tooltip"
                  >
                    連結 <FaSpotify className="ml-2 text-white w-4 h-4 xl:w-6 xl:h-6" />
                  </button>
                  <Tooltip
                    id="spotify-tooltip"
                    place="top"
                    content="帳號：moodflow2024@gmail.com 密碼：2024@Moodflow"
                  />
                </>
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
                className={`text-sm lg:text-2xl ${
                  day === "週六" || day === "週日" ? "text-red-400" : "text-dark-blue"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          {/* 日曆 */}
          <div
            className="grid grid-cols-7 gap-y-2 gap-x-2 md:gap-2 lg:gap-4 text-center mt-2"
            onWheel={handleWheel}
          >
            {renderDays()}
          </div>{" "}
          <div className="flex justify-center items-center mt-4 mb-12">
            <img src={pencil} className="w-3/4"></img>
          </div>
        </div>
        {alertMessage && (
          <Alert
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
            onConfirm={alertConfirm}
          />
        )}
      </div>
    </div>
  );
}

export default DiaryCalendar;
