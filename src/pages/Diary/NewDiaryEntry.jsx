import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useEffect } from "react";
import { FaSpotify } from "react-icons/fa";
import { IoMdCloseCircle } from "react-icons/io";
import { TiThMenu } from "react-icons/ti";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../../AppContext";
import angry from "../../assets/images/angry.png";
import anxiety from "../../assets/images/anxiety.png";
import blue from "../../assets/images/blue.png";
import calm from "../../assets/images/calm.png";
import cry from "../../assets/images/cry.png";
import excited from "../../assets/images/excited.png";
import happy from "../../assets/images/happy.png";
import joy from "../../assets/images/joy.png";
import sad from "../../assets/images/sad.png";
import Alert from "../../components/alert";
import { SpotifyTracks } from "../../components/spotifyTrack";
import { useSpotifyPlayer } from "../../utils/SpotifyPlayerContext";
import { auth, db } from "../../utils/firebase";
import { handleImageUpload, simplifyTrack } from "../../utils/firebase-data";
import Sidebar from "../Sidebar";

function NewDiaryEntry() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedDate = searchParams.get("date");
  const {
    spotifyToken,
    handleSpotifyLogin,
    isPlaying,
    currentTrack,
    handlePlayPause,
    handleTrackSelect,
  } = useSpotifyPlayer();

  const handleSelectTrackForDiary = (track) => {
    if (track === null) {
      dispatch({ type: "SET_SELECTED_TRACK", payload: null });
    } else {
      dispatch({ type: "SET_SELECTED_TRACK", payload: simplifyTrack(track) });
    }
  };

  const moods = [
    { img: happy, label: "開心" },
    { img: joy, label: "快樂" },
    { img: excited, label: "興奮" },
    { img: calm, label: "平靜" },
    { img: anxiety, label: "焦慮" },
    { img: angry, label: "生氣" },
    { img: blue, label: "憂鬱" },
    { img: sad, label: "悲傷" },
    { img: cry, label: "哭泣" },
  ];
  useEffect(() => {
    const initializeState = () => {
      dispatch({ type: "RESET_MENU" });
      dispatch({ type: "RESET_NEW_DIARY_STATE" });
      dispatch({ type: "SET_SELECTED_MOOD", payload: null });
    };

    initializeState();

    return () => {
      dispatch({ type: "RESET_NEW_DIARY_STATE" });
    };
  }, []);

  const handleMoodSelect = (mood) => dispatch({ type: "SET_SELECTED_MOOD", payload: mood });

  const handleDiaryChange = (event) =>
    dispatch({ type: "SET_DIARY_CONTENT", payload: event.target.value });

  const handleSubmit = async () => {
    if (!state.newDiaryEntry.selectedMood || !state.newDiaryEntry.diaryContent.trim()) {
      dispatch({ type: "SET_ALERT", payload: { message: "請選擇一個心情並輸入日記內容。" } });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    const user = auth.currentUser;

    if (!user) {
      dispatch({ type: "SET_ALERT", payload: { message: "使用者尚未登入" } });
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    try {
      const diaryEntry = {
        date: selectedDate,
        mood: state.newDiaryEntry.selectedMood,
        content: state.newDiaryEntry.diaryContent,
        userId: user.uid,
        track: state.newDiaryEntry.selectedTrack || null,
        imageUrls:
          state.newDiaryEntry.uploadedImages.length > 0 ? state.newDiaryEntry.uploadedImages : null,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "diaries"), diaryEntry);

      dispatch({
        type: "SET_ALERT",
        payload: {
          message: "日記已成功保存！",
          confirm: () => {},
        },
      });
      setTimeout(() => {
        dispatch({ type: "CLEAR_ALERT" });
        navigate(`/diary-calendar/${user.uid}`);
      }, 1000);
    } catch (error) {
      console.error("保存日記時出錯: ", error);
      dispatch({ type: "SET_ALERT", payload: { message: "保存日記時出錯，請稍後再試。" } });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleImageUploadWrapper = async (event) => {
    try {
      await handleImageUpload(event, state.newDiaryEntry.uploadedImages, (newImageUrl) => {
        dispatch({ type: "ADD_UPLOADED_IMAGE", payload: newImageUrl });
      });
    } catch (error) {
      dispatch({ type: "SET_ALERT", payload: { message: error.message } });
    }
  };

  const handleRemoveImageWrapper = (index) => {
    dispatch({ type: "REMOVE_UPLOADED_IMAGE", payload: index });
  };

  const handlePlayTrack = async (track) => {
    try {
      if (currentTrack?.uri === track.uri) {
        await handlePlayPause();
      } else {
        await handleTrackSelect(track.uri);
      }
    } catch (error) {
      console.error("播放歌曲時發生錯誤", error);
      dispatch({ type: "SET_ALERT", payload: { message: "播放出錯，請稍後再試" } });
    }
  };
  return (
    <div className="flex-1 pb-12">
      <Sidebar
        isMenuOpen={state.common.isMenuOpen}
        setIsMenuOpen={() => dispatch({ type: "TOGGLE_MENU" })}
      />

      <div className="flex-none p-4">
        <TiThMenu
          className="h-8 w-8 cursor-pointer text-gray-600 hover:text-gray-800"
          onClick={() => dispatch({ type: "TOGGLE_MENU" })}
        />
      </div>
      <h1 className="text-3xl text-center mt-4 mb-4">Today's Mood</h1>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl text-center mb-6">
          {selectedDate ? selectedDate : "No date selected"}
        </h2>

        <div className="flex flex-wrap justify-around items-center mb-12 h-32">
          {moods.map((mood) => (
            <div
              key={mood.label}
              className={`flex flex-col items-center cursor-pointer transition-transform duration-200 ${
                state.newDiaryEntry.selectedMood === mood.label ? "scale-125" : "scale-100"
              }`}
              onClick={() => handleMoodSelect(mood.label)}
            >
              <img
                src={mood.img}
                className={`h-16 ${
                  state.newDiaryEntry.selectedMood === mood.label ? "h-20" : "h-16"
                }`}
                alt={mood.label}
              />
              {state.newDiaryEntry.selectedMood === mood.label && (
                <p className="mt-2 text-lg">{mood.label}</p>
              )}
            </div>
          ))}
        </div>

        <textarea
          className="w-full bg-gray-100 h-64 rounded-lg p-4 resize-none  break-all overflow-wrap break-word"
          placeholder="輸入今天的日記..."
          value={state.newDiaryEntry.diaryContent}
          onChange={handleDiaryChange}
        />

        <div className="relative w-full h-auto rounded-lg mb-6">
          <div className="flex items-center justify-start space-x-4">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/jpg,image/jpeg,image/png,image/gif"
              onChange={handleImageUploadWrapper}
              multiple
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="h-10 w-10 text-lg bg-gray-200 rounded-full flex justify-center items-center">
                +
              </div>
            </label>
            <p className="text-sm text-gray-500">最多上傳三張圖片</p>
          </div>

          {state.newDiaryEntry.uploadedImages && state.newDiaryEntry.uploadedImages.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {state.newDiaryEntry.uploadedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemoveImageWrapper(index)}
                    className="absolute top-2 right-2 bg-white rounded-full"
                  >
                    <IoMdCloseCircle className="text-light-pink hover:text-red-600 w-5 h-5 " />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {spotifyToken ? (
          <SpotifyTracks
            onSelectTrackForDiary={handleSelectTrackForDiary}
            onPlayTrack={handlePlayTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
          />
        ) : (
          <button
            className="flex bg-gradient-to-tl from-[#33a9a0] to-[#c4e81d]  text-white text-sm lg:text-lg p-1 lg:px-4 lg:py-2 rounded-lg items-center"
            onClick={handleSpotifyLogin}
          >
            連結 <FaSpotify className="ml-2 text-white w-4 h-4 xl:w-6 xl:h-6" />
          </button>
        )}

        <div className="flex justify-center mt-6">
          <button
            className={`bg-yellow-400 text-black px-8 py-2 rounded-lg transition-colors duration-200 ${
              state.newDiaryEntry.loading ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-500"
            }`}
            onClick={handleSubmit}
            disabled={state.newDiaryEntry.loading}
          >
            {state.common.loading ? "保存中..." : "送出"}
          </button>
        </div>
      </div>
      {state.common.alertMessage && (
        <Alert
          message={state.common.alertMessage}
          onClose={() => dispatch({ type: "CLEAR_ALERT" })}
          onConfirm={state.common.alertConfirm}
        />
      )}
    </div>
  );
}

export default NewDiaryEntry;
