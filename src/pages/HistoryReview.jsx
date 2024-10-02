import React, { useState, useEffect } from "react";
import { subMonths, format } from "date-fns";
import { fetchHistoryData } from "../utills/firebase-data";
import { useParams } from "react-router-dom";
import { useSpotifyPlayer } from "../utills/SpotifyPlayerContext";
import { IoPlayCircle, IoPauseCircle } from "react-icons/io5";
import moodIcons from "../utills/moodIcons";
import Sidebar from "../pages/Sidebar";
import { TiThMenu } from "react-icons/ti";

const monthNamesInChinese = {
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

function HistoryReview() {
  const [historyData, setHistoryData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const { userId } = useParams();
  const { isPlaying, currentTrack, handlePlayPause, handleTrackSelect } = useSpotifyPlayer();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const today = new Date();
  const monthInEnglish = format(subMonths(today, 1), "MMMM");
  // 從對照表獲取中文月份名稱
  const monthInChinese = monthNamesInChinese[monthInEnglish];

  // 最終顯示結果： 英文月份 / 中文月份
  const formattedMonth = `${monthInEnglish}  ${monthInChinese}`;

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

  const handlePlayTrack = async (track) => {
    if (currentTrack?.uri === track.uri) {
      await handlePlayPause();
    } else {
      await handleTrackSelect(track.uri);
    }
  };

  const handleImageClick = (imageUrl) => {
    setPreviewImage(imageUrl);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <div className="flex-grow p-8">
        <div className="flex items-center mb-6">
          <TiThMenu
            className="w-6 h-6 lg:h-8 lg:w-8 mr-4 cursor-pointer text-gray-600 hover:text-gray-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
          <h1 className="text-2xl sm:text-3xl font-bold">歷史回顧</h1>
        </div>
        {/* 日期與區間篩選器 */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="mb-2 text-sm sm:text-base">篩選日期區間：</label>
            <div className="flex">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border p-2 mr-2 rounded-lg"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border p-2 rounded-lg"
              />
            </div>
            <button
              className="bg-light-blue-dark lg:w-[300px] text-white px-4 py-2 rounded-lg mt-4 hover:bg-amber-300 transition"
              onClick={handleDateRangeFilter}
            >
              篩選區間
            </button>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm sm:text-base">篩選條件：</label>
            <select className="border p-2 rounded-lg " onChange={handleFilterChange}>
              <option value="">選擇篩選條件</option>
              <option value="lastMonth">上個月</option>
              <option value="lastThreeMonths">前三個月</option>
              <option value="lastYear">去年</option>
            </select>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6">
          {isFiltered ? "回顧內容" : `上個月的今天:  ${formattedMonth}/${format(today, "dd")}`}
        </h1>

        {/* 日記顯示區域 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 lg:flex lg:flex-col min-h[200px] lg:items-center">
          {historyData.length > 0 ? (
            historyData.map((diary, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 bg-white shadow-lg flex flex-col lg:flex-row lg:w-10/12 items-center"
              >
                {/* 左側心情圖標與文字 */}
                <div className="flex flex-col lg:flex-row flex-grow lg:w-2/3 ">
                  {/* 心情圖標 */}
                  <div className="flex items-start mr-4 flex-shrink-0">
                    <img
                      src={moodIcons[diary.mood]}
                      className="w-12 h-12 lg:w-16 lg:h-16 rounded-full"
                      alt="Mood"
                    />
                  </div>
                  {/* 日期與日記內容 */}
                  <div className="flex flex-col">
                    <h3 className="text-lg sm:text-xl font-bold mb-2">
                      {diary.date ? format(new Date(diary.date), "yyyy-MM-dd") : "無有效日期"}
                    </h3>
                    <p className="mb-4 text-base lg:text-xl">{diary.content}</p>
                    {/* 音樂區域 */}
                    {diary.track && (
                      <div className="mt-2">
                        <h4 className="text-lg font-bold mb-2">音樂：</h4>
                        <div className="p-4 xl:w-[480px] sm:w-[300px] flex items-center space-x-4 bg-gray-100 rounded-lg shadow-md sm:mb-2">
                          <img
                            src={diary.track.albumImageUrl}
                            alt={diary.track.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full"
                          />
                          <div className="flex-1 text-sm sm:text-base">
                            <p>{diary.track.name}</p>
                            <p>{diary.track.artists.join(", ")}</p>
                          </div>

                          <button
                            onClick={() => handlePlayTrack(diary.track)}
                            className="text-green-500"
                          >
                            {isPlaying && currentTrack?.uri === diary.track.uri ? (
                              <IoPauseCircle size={32} />
                            ) : (
                              <IoPlayCircle size={32} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 右側圖片區域 */}
                {diary.imageUrls?.[0] && (
                  <div className="w-full h-40 lg:w-48 lg:h-48 overflow-hidden rounded-lg lg:ml-4">
                    <img
                      src={diary.imageUrls?.[0]}
                      alt="Diary"
                      className="w-full h-full object-cover"
                      onClick={() => handleImageClick(diary.imageUrls[0])}
                    />
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="col-span-full text-center">目前沒有日記記錄。</p>
          )}
        </div>
      </div>
      {/* 圖片預覽模態框 */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center"
          onClick={closeImagePreview}
        >
          <div className="relative">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-full" />
            <button
              className="absolute top-2 right-2 text-white text-2xl"
              onClick={closeImagePreview}
            >
              x
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryReview;
