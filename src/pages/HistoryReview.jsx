import React, { useState, useEffect } from "react";
import { subMonths, format } from "date-fns";
import { fetchHistoryData } from "../utils/firebase-data";
import { useParams } from "react-router-dom";
import { useSpotifyPlayer } from "../utils/SpotifyPlayerContext";
import moodIcons from "../utils/moodIcons";
import Sidebar from "../pages/Sidebar";
import Alert from "../components/alert";
import { IoPlayCircle, IoPauseCircle } from "react-icons/io5";
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertConfirm, setAlertConfirm] = useState(null);
  const [selectedMood, setSelectedMood] = useState("全部");
  const { userId } = useParams();
  const { isPlaying, currentTrack, handlePlayPause, handleTrackSelect } = useSpotifyPlayer();
  const today = new Date();
  const monthInEnglish = format(subMonths(today, 1), "MMMM");
  const monthInChinese = monthNamesInChinese[monthInEnglish];
  const formattedMonth = `${monthInEnglish}  ${monthInChinese}`;

  const moodOptions = [
    "全部",
    "開心",
    "快樂",
    "興奮",
    "平靜",
    "焦慮",
    "生氣",
    "憂鬱",
    "悲傷",
    "哭泣",
  ];

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

  const fetchFilteredData = async (startDate, endDate, mood = "全部") => {
    if (!startDate || !endDate) {
      console.error("Start date or end date is undefined");
      return;
    }

    try {
      setIsFiltered(true);
      setHistoryData([]);
      let data = await fetchHistoryData(
        userId,
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );

      if (mood !== "全部") {
        data = data.filter((diary) => diary.mood === mood);
      }

      setHistoryData(data);
      setStartDate(startDate);
      setEndDate(endDate);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    }
  };

  const filterByMood = (data, mood) => {
    if (mood === "全部") return data;
    return data.filter((diary) => diary.mood === mood);
  };

  const handleMoodFilterChange = (e) => {
    const newMood = e.target.value;
    setSelectedMood(newMood);

    if (!startDate || !endDate) {
      setAlertMessage("請先選擇日期篩選區間再篩選心情！");
      return;
    }

    fetchFilteredData(startDate, endDate, newMood);
  };

  const handleDateRangeFilter = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!startDate || !endDate) {
      setAlertMessage("請選擇完整的日期區間");
      return;
    }

    if (start > end) {
      setAlertMessage("開始日期不能大於結束日期");
      return;
    }

    setIsFiltered(true);

    fetchFilteredData(start, end, selectedMood);
  };

  const handleFilterChange = async (e) => {
    const today = new Date();
    let startDate;
    let endDate = today;

    switch (e.target.value) {
      case "lastMonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "lastThreeMonths":
        startDate = subMonths(today, 3);
        break;
      case "lastYear":
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
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
    <div className="flex flex-col min-h-screen lg:p-8">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <div className=" p-4 md:p-8">
        <div className="flex items-center mb-6">
          <TiThMenu
            className="w-6 h-6 lg:h-8 lg:w-8 mr-4 cursor-pointer text-gray-600 hover:text-gray-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
          <h1 className="text-2xl sm:text-3xl">歷史回顧</h1>
        </div>

        <div className="mb-6 grid sm:grid-cols-2 gap-4 sm:gap-8 max-w-5xl mx-auto">
          <div className="flex flex-col">
            <label className="mb-2 text-sm sm:text-base">篩選日期區間：</label>
            <div className="flex  sm:items-center ">
              <input
                type="date"
                value={startDate ? format(new Date(startDate), "yyyy-MM-dd") : ""}
                onChange={(e) => setStartDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
                className="border p-2 mr-2 rounded-lg "
              />

              <input
                type="date"
                value={endDate ? format(new Date(endDate), "yyyy-MM-dd") : ""}
                onChange={(e) => setEndDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
                className="border p-2 rounded-lg "
              />
            </div>
            <button
              className="bg-light-blue-dark w-[full] sm:w-auto text-white px-4 py-2 rounded-lg mt-4 hover:bg-amber-300 transition"
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

          <div className="flex flex-col sm:col-span-2">
            <label className="mb-2 text-sm sm:text-base">篩選心情：</label>
            <select className="border p-2 rounded-lg " onChange={handleMoodFilterChange}>
              {moodOptions.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h1 className="text-xl sm:text-3xl mb-6 ">
          {isFiltered
            ? `回顧內容 (${
                startDate && !isNaN(new Date(startDate))
                  ? format(new Date(startDate), "yyyy-MM-dd")
                  : "無效日期"
              } - 
       ${
         endDate && !isNaN(new Date(endDate)) ? format(new Date(endDate), "yyyy-MM-dd") : "無效日期"
       })`
            : `上個月的今天:  ${formattedMonth}/${format(today, "dd")}`}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 lg:flex lg:flex-col min-h[200px] lg:items-center">
          {historyData.length > 0 ? (
            filterByMood(historyData, selectedMood).length > 0 ? (
              filterByMood(historyData, selectedMood).map((diary, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-white shadow-lg flex flex-col lg:flex-row lg:w-10/12 items-center"
                >
                  <div className="flex flex-col lg:flex-row flex-grow lg:w-2/3 ">
                    <div className="flex items-start mr-4 flex-shrink-0">
                      <img
                        src={moodIcons[diary.mood]}
                        className="w-12 h-12 lg:w-16 lg:h-16 rounded-full"
                        alt="Mood"
                      />
                    </div>

                    <div className="flex flex-col">
                      <h3 className="text-lg sm:text-xl mb-2">
                        {diary.date ? format(new Date(diary.date), "yyyy-MM-dd") : "無有效日期"}
                      </h3>
                      <p className="mb-4 text-base lg:text-xl">{diary.content}</p>

                      {diary.track && (
                        <div className="mt-2">
                          <h4 className="text-lg mb-2">音樂：</h4>
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
              <p className="col-span-full text-center text-black lg:mt-24">
                目前沒有符合篩選條件的日記記錄。
              </p>
            )
          ) : (
            <p className="col-span-full text-center text-black lg:mt-24 lg:text-lg">
              目前沒有日記記錄 !! 趕快去新增日記吧！
            </p>
          )}
        </div>
      </div>

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
      {alertMessage && (
        <Alert
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
          onConfirm={alertConfirm}
        />
      )}
    </div>
  );
}

export default HistoryReview;
