import React, { useState, useEffect } from "react";
import { subMonths, format } from "date-fns";
import { fetchHistoryData } from "../utills/firebase-data";
import { useParams } from "react-router-dom";

import { useSpotifyPlayer } from "../utills/SpotifyPlayer";
import logo from "../assets/images/logo-3.png";
import { FaChevronCircleLeft, FaChevronCircleRight } from "react-icons/fa";
import { IoPlayCircle, IoPauseCircle } from "react-icons/io5";
import moodIcons from "../utills/moodIcons";

function HistoryReview() {
  const [historyData, setHistoryData] = useState([]);
  const [currentDiaryIndex, setCurrentDiaryIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const lastMonthSameDay = subMonths(new Date(), 1);
  const formattedDate = format(lastMonthSameDay, "yyyy-MM-dd");
  const formattedTitle = format(lastMonthSameDay, "MMMM dd");
  const { userId } = useParams();
  const { isPlaying, currentTrack, handlePlayPause, handleTrackSelect, player, spotifyToken } =
    useSpotifyPlayer();

  useEffect(() => {
    const loadDiaryForLastMonthSameDay = async () => {
      try {
        const data = await fetchHistoryData(userId, formattedDate, formattedDate);
        setHistoryData(data);
      } catch (error) {
        console.error("Error loading history data: ", error);
      }
    };

    loadDiaryForLastMonthSameDay();
  }, [formattedDate, userId, isFiltered]);

  // 根據使用者選擇的日期查詢日記
  const handleSingleDateFilter = async () => {
    if (selectedDate) {
      try {
        const data = await fetchHistoryData(userId, selectedDate, selectedDate);
        setHistoryData(data);
      } catch (error) {
        console.error("Error fetching diary for selected date: ", error);
      }
    } else {
      alert("請選擇日期");
    }
  };

  const handleDateRangeFilter = async () => {
    if (startDate && endDate) {
      try {
        const data = await fetchHistoryData(userId, startDate, endDate);
        setHistoryData(data);
        setCurrentDiaryIndex(0);
      } catch (error) {
        console.error("Error fetching diary for date range: ", error);
      }
    } else {
      alert("請選擇完整的日期區間");
    }
  };
  //左右切換
  const handlePrevious = () => {
    if (currentDiaryIndex > 0) {
      setCurrentDiaryIndex((prevIndex) => prevIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentDiaryIndex < historyData.length - 1) {
      setCurrentDiaryIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePlayTrack = async (track) => {
    if (currentTrack?.uri === track.uri && isPlaying) {
      await handlePlayPause();
    } else {
      await handleTrackSelect(track.uri);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">歷史回顧</h1>

      {/* 日期與區間篩選器 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col">
          {/* 單日篩選 */}
          <label className="mb-2">篩選特定日期：</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2 mb-4"
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleSingleDateFilter}
          >
            篩選日期
          </button>
        </div>

        <div className="flex flex-col">
          {/* 區間篩選 */}
          <label className="mb-2">篩選日期區間：</label>
          <div className="flex">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-2 mr-2"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-2"
            />
          </div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            onClick={handleDateRangeFilter}
          >
            篩選區間
          </button>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-4">
        {isFiltered ? "歷史回顧" : ` 上個月的今天: ${formattedTitle}`}
      </h1>
      {/* 日記顯示區域 */}
      <div className="flex items-center justify-center">
        <button className="mr-4" onClick={handlePrevious} disabled={currentDiaryIndex === 0}>
          <FaChevronCircleLeft />
        </button>
        {historyData.length > 0 ? (
          <div className="border rounded-lg p-4 w-96">
            <img
              src={
                historyData[currentDiaryIndex].imageUrls
                  ? historyData[currentDiaryIndex].imageUrls[0]
                  : logo
              }
              alt="Diary"
              className="mb-4"
            />
            {historyData[currentDiaryIndex].mood && (
              <div className="flex justify-center">
                <img
                  src={moodIcons[historyData[currentDiaryIndex].mood]}
                  className="w-16 h-16 rounded-full"
                />
              </div>
            )}
            <h3 className="text-lg font-bold">
              {format(new Date(historyData[currentDiaryIndex].date), "yyyy-MM-dd")}
            </h3>

            <p className="mb-4">{historyData[currentDiaryIndex].content}</p>

            {/* 顯示 Spotify 音樂資訊 */}
            {historyData[currentDiaryIndex].track && (
              <div className="mt-4">
                <h4 className="text-lg font-bold">音樂：</h4>
                <img
                  src={historyData[currentDiaryIndex].track.albumImageUrl}
                  alt={historyData[currentDiaryIndex].track.name}
                  className="w-16 h-16 rounded-full"
                />
                <p>{historyData[currentDiaryIndex].track.name}</p>
                <p>{historyData[currentDiaryIndex].track.artists.join(", ")}</p>
                {console.log(historyData)}
                {/* 點擊播放 */}
                <button
                  onClick={() => handlePlayTrack(historyData[currentDiaryIndex].track)}
                  className="text-green-500"
                >
                  {isPlaying && currentTrack?.uri === historyData[currentDiaryIndex].track.uri ? (
                    <IoPauseCircle size={40} />
                  ) : (
                    <IoPlayCircle size={40} />
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p>目前沒有日記記錄。</p>
        )}
        <button
          className="ml-4"
          onClick={handleNext}
          disabled={currentDiaryIndex >= historyData.length - 1}
        >
          {" "}
          <FaChevronCircleRight />
        </button>
      </div>
    </div>
  );
}

export default HistoryReview;
