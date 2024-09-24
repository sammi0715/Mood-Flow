import React, { useState, useEffect } from "react";
import { subMonths, format } from "date-fns";
import { fetchHistoryData } from "../utills/firebase-data";
import { useParams } from "react-router-dom";
import { useSpotifyPlayer } from "../utills/SpotifyPlayerContext";
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
  const { userId } = useParams();
  const { isPlaying, currentTrack, handlePlayPause, handleTrackSelect } = useSpotifyPlayer();

  const today = new Date();

  useEffect(() => {
    const loadDiaryForLastMonthSameDay = async () => {
      if (isFiltered) return;
      try {
        const lastMonthSameDay = subMonths(today, 1);
        const data = await fetchHistoryData(
          userId,
          format(lastMonthSameDay, "yyyy-MM-dd"),
          format(lastMonthSameDay, "yyyy-MM-dd")
        );
        setHistoryData(data);
      } catch (error) {
        console.error("Error loading history data: ", error);
      }
    };

    if (!isFiltered) {
      loadDiaryForLastMonthSameDay();
    }
  }, [userId, today, isFiltered]);

  const fetchFilteredData = async (startDate, endDate) => {
    if (!startDate || !endDate) {
      console.error("Start date or end date is undefined");
      return;
    }

    try {
      setIsFiltered(true);
      setHistoryData([]);
      const data = await fetchHistoryData(
        userId,
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );
      setHistoryData(data);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    }
  };

  // 單日期篩選
  const handleSingleDateFilter = async () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setIsFiltered(true);
      fetchFilteredData(date, date);
    } else {
      alert("請選擇日期");
    }
  };

  const handleDateRangeFilter = () => {
    if (startDate && endDate) {
      setIsFiltered(true);
      fetchFilteredData(new Date(startDate), new Date(endDate));
    } else {
      alert("請選擇完整日期區間");
    }
  };
  //固定區間
  const handleFilterChange = async (e) => {
    const today = new Date();
    let startDate;
    let endDate = today;

    switch (e.target.value) {
      case "lastMonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1); // 上個月的第一天
        endDate = new Date(today.getFullYear(), today.getMonth(), 0); // 上個月的最後一天
        break;
      case "lastThreeMonths":
        startDate = subMonths(today, 3); // 前三個月的開始日期
        break;
      case "lastYear":
        startDate = new Date(today.getFullYear() - 1, 0, 1); // 去年的第一天
        endDate = new Date(today.getFullYear() - 1, 11, 31); // 去年的最後一天
        break;
      default:
        return;
    }

    fetchFilteredData(startDate, endDate);
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
    if (currentTrack?.uri === track.uri) {
      await handlePlayPause();
    } else {
      await handleTrackSelect(track.uri);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">歷史回顧</h1>

      {/* 日期與區間篩選器 */}
      <div className="mb-4 flex items-center justify-around">
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

        <div className="mb-4 flex items-center">
          <label className="mb-2">篩選條件：</label>
          <select className="border p-2 ml-2" onChange={handleFilterChange}>
            <option value="">選擇篩選條件</option>
            <option value="lastMonth">上個月</option>
            <option value="lastThreeMonths">前三個月</option>
            <option value="lastYear">去年</option>
          </select>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4">
        {isFiltered ? "歷史回顧" : ` 上個月的今天: ${format(today, "MMMM dd")}`}
      </h1>

      {/* 日記顯示區域 */}
      <div className="flex items-center justify-center">
        <button className="mr-4" onClick={handlePrevious} disabled={currentDiaryIndex === 0}>
          <FaChevronCircleLeft className="w-8 h-8" />
        </button>
        {historyData.length > 0 ? (
          <div className="border rounded-lg p-4 w-96">
            <img
              src={
                historyData[currentDiaryIndex]?.imageUrls?.length > 0
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
                  className="w-16 h-16 rounded-lg"
                />
              </div>
            )}
            <h3 className="text-lg font-bold">
              {format(new Date(historyData[currentDiaryIndex].date), "yyyy-MM-dd")}
            </h3>

            <p className="mb-4">{historyData[currentDiaryIndex].content}</p>

            {/* 顯示 Spotify 音樂資訊 */}
            {historyData[currentDiaryIndex].track && (
              <div>
                <h4 className="text-lg font-bold">音樂：</h4>
                <div className="mt-4 p-4 flex items-center space-x-4 bg-gray-100 rounded-lg shadow-md">
                  <img
                    src={historyData[currentDiaryIndex].track.albumImageUrl}
                    alt={historyData[currentDiaryIndex].track.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <p>{historyData[currentDiaryIndex].track.name}</p>
                    <p>{historyData[currentDiaryIndex].track.artists.join(", ")}</p>
                  </div>

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
          <FaChevronCircleRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

export default HistoryReview;
