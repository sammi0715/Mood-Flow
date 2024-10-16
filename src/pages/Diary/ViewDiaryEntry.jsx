import { doc, getDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useReducer } from "react";
import { FaRegComment, FaSpotify } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import { IoMdCloseCircle } from "react-icons/io";
import { IoPauseCircle, IoPlayCircle } from "react-icons/io5";
import { TiThMenu } from "react-icons/ti";
import { useNavigate, useParams } from "react-router-dom";
import CommentSection from "../../components/CommentSection";
import LikeTooltip from "../../components/LikeTooltip";
import Alert from "../../components/alert";
import { SpotifyTracks } from "../../components/spotifyTrack";
import { useSpotifyPlayer } from "../../utils/SpotifyPlayerContext";
import { db } from "../../utils/firebase";
import {
  deleteDiary,
  handleImageUpload,
  listenToComments,
  simplifyTrack,
  toggleLikeDiary,
  updateDiary,
} from "../../utils/firebase-data";
import moodIcons from "../../utils/moodIcons";
import Sidebar from "../Sidebar";

const initialState = {
  diary: null,
  loading: true,
  isEditing: false,
  updatedContent: "",
  updatedMood: "",
  updatedTrack: null,
  updatedImages: [],
  uploadedImages: [],
  isMenuOpen: false,
  alertMessage: null,
  alertConfirm: null,
  likes: [],
  comments: [],
  showCommentInput: {},
};

function diaryReducer(state, action) {
  switch (action.type) {
    case "SET_DIARY":
      return {
        ...state,
        diary: action.payload,
        updatedContent: action.payload.content,
        updatedMood: action.payload.mood,
        updatedTrack: action.payload.track,
        updatedImages: action.payload.imageUrls || [],
        loading: false,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_EDITING":
      return { ...state, isEditing: action.payload };
    case "UPDATE_CONTENT":
      return { ...state, updatedContent: action.payload };
    case "UPDATE_MOOD":
      return { ...state, updatedMood: action.payload };
    case "UPDATE_TRACK":
      return { ...state, updatedTrack: action.payload };
    case "ADD_IMAGE":
      return { ...state, uploadedImages: [...state.uploadedImages, action.payload] };
    case "REMOVE_IMAGE":
      return {
        ...state,
        updatedImages: state.updatedImages.filter((_, index) => index !== action.payload),
        uploadedImages: state.uploadedImages.filter((_, index) => index !== action.payload),
      };
    case "SET_LIKES":
      return { ...state, likes: action.payload };
    case "SET_COMMENTS":
      return { ...state, comments: action.payload };
    case "TOGGLE_COMMENT_INPUT":
      return {
        ...state,
        showCommentInput: {
          ...state.showCommentInput,
          [action.payload]: !state.showCommentInput[action.payload],
        },
      };
    case "SET_ALERT":
      return {
        ...state,
        alertMessage: action.payload.message,
        alertConfirm: action.payload.confirm,
      };
    case "CLEAR_ALERT":
      return { ...state, alertMessage: null, alertConfirm: null };
    case "TOGGLE_MENU":
      return { ...state, isMenuOpen: !state.isMenuOpen };
    default:
      return state;
  }
}

function ViewDiaryEntry() {
  const [state, dispatch] = useReducer(diaryReducer, initialState);
  const { diaryId } = useParams();
  const navigate = useNavigate();

  const {
    isPlaying,
    currentTrack,
    handlePlayPause,
    handleTrackSelect,
    handleSpotifyLogin,
    player,
    spotifyToken,
    deviceId,
    initializePlayer,
  } = useSpotifyPlayer();

  const userId = localStorage.getItem("user_uid");
  const moodOptions = ["開心", "快樂", "興奮", "平靜", "焦慮", "生氣", "憂鬱", "悲傷", "哭泣"];

  useEffect(() => {
    const fetchDiary = async () => {
      try {
        const diaryRef = doc(db, "diaries", diaryId);
        const diarySnap = await getDoc(diaryRef);
        if (diarySnap.exists()) {
          dispatch({ type: "SET_DIARY", payload: diarySnap.data() });
        } else {
          dispatch({ type: "SET_ALERT", payload: { message: "找不到該日記。" } });
          navigate("/diary-calendar");
        }
      } catch (error) {
        console.error("Error fetching diary: ", error);
        dispatch({ type: "SET_ALERT", payload: { message: "加載日記時出錯，請稍後再試。" } });
      }
    };

    if (diaryId) {
      fetchDiary();
    }
  }, [diaryId, navigate]);

  useEffect(() => {
    const unsubscribeComments = listenToComments(diaryId, (updatedComments) => {
      dispatch({ type: "SET_COMMENTS", payload: updatedComments });
    });

    const diaryRef = doc(db, "diaries", diaryId);
    const unsubscribeLikes = onSnapshot(diaryRef, (snapshot) => {
      if (snapshot.exists()) {
        const diaryData = snapshot.data();
        dispatch({ type: "SET_LIKES", payload: diaryData.likes || [] });
      }
    });

    return () => {
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [diaryId]);

  const handlePlayButton = async () => {
    if (!spotifyToken) {
      dispatch({ type: "SET_ALERT", payload: { message: "請先登錄 Spotify" } });
      return;
    }

    if (!player) {
      initializePlayer();
    }

    await waitForSpotifyPlayerReady();

    if (state.diary && state.diary.track) {
      if (currentTrack?.uri === state.diary.track.uri) {
        await handlePlayPause();
      } else {
        await handleTrackSelect(state.diary.track.uri);
      }
    }
  };

  const handlePlayTrack = async (track) => {
    try {
      await handleTrackSelect(track.uri);
    } catch (error) {
      console.error("播放歌曲時發生錯誤", error);
    }
  };

  const waitForSpotifyPlayerReady = () => {
    return new Promise((resolve) => {
      const checkPlayer = () => {
        if (player && deviceId) {
          resolve();
        } else {
          setTimeout(checkPlayer, 100);
        }
      };
      checkPlayer();
    });
  };
  const handleSave = async () => {
    if (!state.updatedContent.trim()) {
      dispatch({ type: "SET_ALERT", payload: { message: "日記內容不能為空白！" } });
      return;
    }
    if (!state.updatedMood) {
      dispatch({ type: "SET_ALERT", payload: { message: "請選擇一個心情圖標！" } });
      return;
    }

    const allImages = [...state.updatedImages, ...state.uploadedImages];
    const updatedData = {
      content: state.updatedContent.trim(),
      mood: state.updatedMood,
      track: state.updatedTrack,
      imageUrls: allImages.length > 0 ? allImages : null,
    };

    try {
      await updateDiary(diaryId, updatedData);
      dispatch({
        type: "SET_ALERT",
        payload: {
          message: "日記更新成功！",
          confirm: () => {
            dispatch({ type: "SET_EDITING", payload: false });
            navigate(`/diary-calendar/${userId}`);
          },
        },
      });
    } catch (error) {
      console.error("Error updating diary: ", error);
      dispatch({ type: "SET_ALERT", payload: { message: "更新日記時出錯，請稍後再試" } });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDiary(diaryId);
      dispatch({
        type: "SET_ALERT",
        payload: {
          message: "日記刪除成功！",
          confirm: () => navigate(`/diary-calendar/${userId}`),
        },
      });
    } catch (error) {
      console.error("Error deleting diary: ", error);
      dispatch({ type: "SET_ALERT", payload: { message: "刪除日記時出錯，請稍後再試。" } });
    }
  };

  const handleImageUploadWrapper = async (event) => {
    try {
      await handleImageUpload(event, state.uploadedImages, (newImageUrl) => {
        dispatch({ type: "ADD_IMAGE", payload: newImageUrl });
      });
    } catch (error) {
      dispatch({ type: "SET_ALERT", payload: { message: error.message } });
    }
  };
  const handleRemoveImageWrapper = (index) => {
    dispatch({ type: "REMOVE_IMAGE", payload: index });
  };

  const handleToggleCommentInput = (diaryId) => {
    dispatch({ type: "TOGGLE_COMMENT_INPUT", payload: diaryId });
  };

  if (state.loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-back">
        <FiLoader className="w-16 h-16 animate-spin spin-slow mb-4 text-light-orange" />
        <p className="text-2xl font-semibold text-light-orange">Loading...</p>
      </div>
    );
  }

  if (!state.diary) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-back">
        <p className="text-2xl font-semibold text-light-orange">Diary not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Sidebar
        isMenuOpen={state.isMenuOpen}
        setIsMenuOpen={() => dispatch({ type: "TOGGLE_MENU" })}
      />
      <div className="flex-grow p-8 bg-back">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-none">
            <TiThMenu
              className="h-6 w-6 lg:h-8 lg:w-8 cursor-pointer"
              onClick={() => dispatch({ type: "TOGGLE_MENU" })}
            />
          </div>

          <div className="flex-grow text-center">
            <h2 className=" text-2xl md:text-4xl ">Diary</h2>
          </div>
          <div className="flex-none">
            {state.isEditing && (
              <button
                onClick={handleSave}
                className="bg-amber-400 text-white px-2 text-lg lg:text-xl rounded"
              >
                保存
              </button>
            )}
          </div>

          <div className="flex-none" style={{ width: "2rem" }}></div>
        </div>
        <h3 className="text-xl text-center mb-4">{state.diary.date}</h3>
        {state.isEditing ? (
          <div className="flex-grow max-w-4xl mx-auto  bg-light-beige bg-opacity-75 border-1 border border-gray-900 p-8 rounded-lg">
            <div className="mb-6">
              {state.updatedMood && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={moodIcons[state.updatedMood]}
                    alt={state.updatedMood}
                    className="h-16 w-16"
                  />
                </div>
              )}
              <div className="flex justify-center">
                <select
                  value={state.updatedMood}
                  onChange={(e) => dispatch({ type: "UPDATE_MOOD", payload: e.target.value })}
                  className="border p-2 w-24 mt-2  flex text-center"
                >
                  <option value="">請選擇心情</option>
                  {moodOptions.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <textarea
                value={state.updatedContent}
                onChange={(e) => dispatch({ type: "UPDATE_CONTENT", payload: e.target.value })}
                className="border p-2 w-full break-all resize-none"
                rows="5"
                placeholder="編輯內容"
              />
            </div>

            {state.updatedImages.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                {state.updatedImages.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-auto object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImageWrapper(index)}
                      className="absolute top-2 right-2 text-white rounded-full"
                    >
                      <IoMdCloseCircle className="text-light-pink hover:text-red-600 w-6 h-6 " />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
            </div>

            {state.uploadedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {state.uploadedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImageWrapper(index)}
                      className="absolute top-2 right-2 text-white bg-white rounded-full"
                    >
                      <IoMdCloseCircle className="text-light-pink hover:text-red-600 w-6 h-6 " />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {state.updatedTrack ? (
              <div className="mb-6">
                <button
                  onClick={() => dispatch({ type: "UPDATE_TRACK", payload: null })}
                  className="text-red-500"
                >
                  刪除/更換音樂
                </button>
                <div className="mt-2 flex items-center space-x-4">
                  <img
                    src={state.updatedTrack.albumImageUrl}
                    alt={state.updatedTrack.name}
                    className="w-24 h-24 rounded-full"
                  />
                  <div>
                    <p className="text-xl">{state.updatedTrack.name}</p>
                    {state.updatedTrack.artists.join(", ")}
                  </div>
                </div>
              </div>
            ) : spotifyToken ? (
              <SpotifyTracks
                onSelectTrackForDiary={(track) => {
                  const simplifiedTrack = simplifyTrack(track);
                  dispatch({ type: "UPDATE_TRACK", payload: simplifiedTrack });
                }}
                onPlayTrack={handlePlayTrack}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
              />
            ) : (
              <div className="mb-6">
                <button
                  className="flex bg-gradient-to-tl from-[#33a9a0] to-[#c4e81d] text-white text-sm lg:text-lg p-1 lg:px-4 lg:py-2 rounded-lg items-center"
                  onClick={handleSpotifyLogin}
                >
                  連結 Spotify <FaSpotify className="ml-2 text-white w-4 h-4 xl:w-6 xl:h-6" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto mt-16 bg-light-beige bg-opacity-75 border-1 border border-gray-900 p-8 rounded-lg">
            <div className="flex items-center mb-4">
              <img
                src={moodIcons[state.diary.mood]}
                alt={state.diary.mood}
                className="h-14 w-14 mr-2"
              />
              <span className="text-lg">{state.diary.mood}</span>
            </div>
            <p className="text-gray-800 mb-6 text-base md:text-lg break-words whitespace-pre-wrap">
              {state.diary.content}
            </p>
            {state.diary.imageUrls && state.diary.imageUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                {state.diary.imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-auto object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
            {state.diary.track && (
              <div className="mt-10">
                <h4 className="text-lg mb-4">Music</h4>
                <div className="flex h-28 p-2 items-center space-x-4  mb-10  bg-gray-100 rounded-lg shadow-md">
                  <img
                    src={state.diary.track.albumImageUrl}
                    alt={state.diary.track.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-base md:text-xl">{state.diary.track.name}</p>
                    <p className="text-sm text-gray-400">{state.diary.track.artists.join(", ")} </p>
                  </div>

                  <button onClick={handlePlayButton} className="p-4">
                    {isPlaying && currentTrack?.uri === state.diary.track.uri ? (
                      <IoPauseCircle size={40} className="text-green-500" />
                    ) : (
                      <IoPlayCircle size={40} className="text-green-500" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => dispatch({ type: "SET_EDITING", payload: true })}
              className="bg-amber-400 text-black p-2 rounded"
            >
              編輯
            </button>
            <button onClick={handleDelete} className="bg-orange-200 text-black p-2 rounded ml-4">
              刪除
            </button>
          </div>
        )}
        {state.alertMessage && (
          <Alert
            message={state.alertMessage}
            onClose={() => dispatch({ type: "CLEAR_ALERT" })}
            onConfirm={state.alertConfirm}
          />
        )}
        <div className="likes-comments-section mt-8 max-w-5xl mx-auto">
          <div className="likes mb-4 flex items-center">
            <LikeTooltip
              diaryId={diaryId}
              likes={state.likes}
              userId={userId}
              toggleLike={toggleLikeDiary}
            />
            <button
              className="text-black flex items-center ml-2"
              onClick={() => handleToggleCommentInput(diaryId)}
            >
              <FaRegComment />
              <span className="ml-2">{state.comments.length}</span>
            </button>
          </div>

          {state.showCommentInput[diaryId] && (
            <CommentSection
              diaryId={diaryId}
              diaryOwnerId={state.diary.userId}
              currentUserId={userId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewDiaryEntry;
