import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../utills/firebase";
import { TiThMenu } from "react-icons/ti";
import moodIcons from "../../utills/moodIcons";
import { IoPlayCircle, IoPauseCircle } from "react-icons/io5";
import { FaRegComment } from "react-icons/fa";
import { useSpotifyPlayer } from "../../utills/SpotifyPlayerContext";
import { IoMdCloseCircle } from "react-icons/io";
import { FaCircleUser } from "react-icons/fa6";
import Alert from "../../utills/alert";
import LikeTooltip from "../../utills/LikeTooltip";
import {
  updateDiary,
  deleteDiary,
  simplifyTrack,
  handleImageUpload,
  handleRemoveImage,
  listenToComments,
  toggleLikeDiary,
  fetchUserData,
  addComment,
} from "../../utills/firebase-data";
import { SpotifyTracks } from "../../utills/spotifyTrack";
import Sidebar from "../Sidebar";

function ViewDiaryEntry() {
  const { diaryId } = useParams();
  const navigate = useNavigate();

  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedContent, setUpdatedContent] = useState("");
  const [updatedMood, setUpdatedMood] = useState("");
  const [updatedTrack, setUpdatedTrack] = useState(null);
  const [updatedImages, setUpdatedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertConfirm, setAlertConfirm] = useState(null);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState({});
  const [userProfiles, setUserProfiles] = useState({});
  const {
    isPlaying,

    currentTrack,
    handlePlayPause,
    handleTrackSelect,
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
          const diaryData = diarySnap.data();
          setDiary(diarySnap.data());
          setUpdatedContent(diarySnap.data().content);
          setUpdatedMood(diarySnap.data().mood);
          setUpdatedTrack(diarySnap.data().track);
          setUpdatedImages(diaryData.imageUrls || []);
        } else {
          console.log("No such document!");
          setAlertMessage("找不到該日記。");
          navigate("/diary-calendar");
        }
      } catch (error) {
        console.error("Error fetching diary: ", error);
        setAlertMessage("加載日記時出錯，請稍後再試。");
      } finally {
        setLoading(false);
      }
    };

    if (diaryId) {
      fetchDiary();
    }
  }, [diaryId, navigate]);

  useEffect(() => {
    const unsubscribeComments = listenToComments(diaryId, (updatedComments) => {
      setComments(updatedComments);
    });

    const diaryRef = doc(db, "diaries", diaryId);
    const unsubscribeLikes = onSnapshot(diaryRef, (snapshot) => {
      if (snapshot.exists()) {
        const diaryData = snapshot.data();
        setLikes(diaryData.likes || []);
      }
    });

    return () => {
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [diaryId]);

  const handlePlayButton = async () => {
    if (!spotifyToken) {
      setAlertMessage("請先登錄 Spotify");
      return;
    }

    if (!player) {
      initializePlayer();
    }

    await waitForSpotifyPlayerReady();

    if (diary && diary.track) {
      if (currentTrack?.uri === diary.track.uri) {
        await handlePlayPause();
      } else {
        await handleTrackSelect(diary.track.uri);
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
    if (!updatedMood) {
      setAlertMessage("請選擇一個心情圖標！");
      return;
    }

    const allImages = [...updatedImages, ...uploadedImages];
    const updatedData = {
      content: updatedContent,
      mood: updatedMood,
      track: updatedTrack
        ? {
            id: updatedTrack.id,
            name: updatedTrack.name,
            uri: updatedTrack.uri,
            artists: updatedTrack.artists,
            albumImageUrl: updatedTrack.albumImageUrl,
          }
        : null,
      imageUrls: allImages.length > 0 ? allImages : null,
    };

    try {
      await updateDiary(diaryId, updatedData);

      setAlertMessage("日記更新成功！");

      setAlertConfirm(() => () => {
        setIsEditing(false);
        navigate(`/diary-calendar/${userId}`);
      });
    } catch (error) {
      console.error("Error updating diary: ", error);
      setAlertMessage("更新日記時出錯，請稍後再試");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDiary(diaryId);
      setAlertMessage("日記刪除成功！");

      setAlertConfirm(() => () => {
        navigate(`/diary-calendar/${userId}`);
      });
    } catch (error) {
      console.error("Error deleting diary: ", error);
      setAlertMessage("刪除日記時出錯，請稍後再試。");
    }
  };

  const handleImageUploadWrapper = async (event) => {
    try {
      await handleImageUpload(event, uploadedImages, setUploadedImages);
    } catch (error) {
      setAlertMessage(error.message);
    }
  };

  const fetchUserProfile = async (userId) => {
    if (!userProfiles[userId]) {
      const userProfile = await fetchUserData(userId);
      setUserProfiles((prev) => ({
        ...prev,
        [userId]: userProfile,
      }));
    }
  };

  const handleAddComment = async (diaryId) => {
    if (!newComment.trim()) {
      setAlertMessage("請輸入留言內容");
      return;
    }

    try {
      await addComment(diaryId, newComment);
      setNewComment("");
      setAlertMessage("留言已送出");
    } catch (error) {
      console.error("添加留言時發生錯誤:", error);
      setAlertMessage("送出留言時發生錯誤，請稍後再試。");
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!diary) {
    return <div className="p-8">Diary not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <div className="flex-grow p-8 bg-back">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-none">
            <TiThMenu
              className="h-6 w-6 lg:h-8 lg:w-8 cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
          </div>

          <div className="flex-grow text-center">
            <h2 className=" text-2xl md:text-4xl ">Diary</h2>
          </div>
          <div className="flex-none">
            {isEditing && (
              <button
                onClick={handleSave}
                className="bg-amber-400 text-white px-2 text-lg lg:text-xl rounded"
              >
                保存
              </button>
            )}
          </div>

          <div className="flex-none" style={{ width: "2rem" }}></div>
        </div>{" "}
        <h3 className="text-xl text-center mb-4">{diary.date}</h3>
        {isEditing ? (
          <div className="flex-grow max-w-4xl mx-auto  bg-light-beige bg-opacity-75 border-1 border border-gray-900 p-8 rounded-lg">
            <div className="mb-6">
              {updatedMood && (
                <div className="mt-4 flex justify-center">
                  <img src={moodIcons[updatedMood]} alt={updatedMood} className="h-16 w-16" />
                </div>
              )}
              <div className="flex justify-center">
                <select
                  value={updatedMood}
                  onChange={(e) => setUpdatedMood(e.target.value)}
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
                value={updatedContent}
                onChange={(e) => setUpdatedContent(e.target.value)}
                className="border p-2 w-full break-all resize-none"
                rows="5"
                placeholder="編輯內容"
              />
            </div>

            {updatedImages.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                {updatedImages.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-auto object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImage(index, setUpdatedImages)}
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

            {uploadedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImage(index, setUpdatedImages)}
                      className="absolute top-2 right-2 text-white bg-white rounded-full"
                    >
                      <IoMdCloseCircle className="text-light-pink hover:text-red-600 w-6 h-6 " />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {updatedTrack ? (
              <div className="mb-6">
                <button onClick={() => setUpdatedTrack(null)} className="text-red-500">
                  刪除音樂
                </button>
                <div className="mt-2 flex items-center space-x-4">
                  <img
                    src={updatedTrack.albumImageUrl}
                    alt={updatedTrack.name}
                    className="w-24 h-24 rounded-full"
                  />
                  <div>
                    <p className="text-xl">{updatedTrack.name}</p>
                    {updatedTrack.artists.join(", ")}
                  </div>
                </div>
              </div>
            ) : (
              <SpotifyTracks
                onSelectTrackForDiary={(track) => {
                  const simplifiedTrack = simplifyTrack(track);
                  setUpdatedTrack(simplifiedTrack);
                }}
                onPlayTrack={handlePlayTrack}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
              />
            )}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto mt-16 bg-light-beige bg-opacity-75 border-1 border border-gray-900 p-8 rounded-lg">
            <div className="flex items-center mb-4">
              <img src={moodIcons[diary.mood]} alt={diary.mood} className="h-14 w-14 mr-2" />
              <span className="text-lg">{diary.mood}</span>
            </div>
            <p className="text-gray-700 mb-6 text-base md:text-lg break-words whitespace-pre-wrap">
              {diary.content}
            </p>
            {diary.imageUrls && diary.imageUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                {diary.imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-auto object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
            {diary.track && (
              <div className="mt-10">
                <h4 className="text-lg mb-4">Music</h4>
                <div className="flex h-28 p-2 items-center space-x-4  mb-10  bg-gray-100 rounded-lg shadow-md">
                  <img
                    src={diary.track.albumImageUrl}
                    alt={diary.track.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-base md:text-xl">{diary.track.name}</p>
                    <p className="text-sm text-gray-400">{diary.track.artists.join(", ")} </p>
                  </div>

                  <button onClick={handlePlayButton} className="p-4">
                    {isPlaying && currentTrack?.uri === diary.track.uri ? (
                      <IoPauseCircle size={40} className="text-green-500" />
                    ) : (
                      <IoPlayCircle size={40} className="text-green-500" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="bg-amber-400 text-black p-2 rounded"
            >
              編輯
            </button>
            <button onClick={handleDelete} className="bg-orange-200 text-black p-2 rounded ml-4">
              刪除
            </button>
          </div>
        )}
        {alertMessage && (
          <Alert
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
            onConfirm={alertConfirm}
          />
        )}
        <div className="likes-comments-section mt-8 max-w-5xl mx-auto">
          <div className="likes mb-4 flex items-center">
            <LikeTooltip
              diaryId={diaryId}
              likes={likes}
              userId={userId}
              toggleLike={toggleLikeDiary}
            />
          </div>

          <div className="comments-section">
            <div className="comments-header flex items-center">
              <FaRegComment className="text-gray-600" />
              <h4 className="text-lg ml-2">留言</h4>
            </div>
            <ul className="mt-4">
              {comments.map((comment) => {
                if (!userProfiles[comment.userId]) {
                  fetchUserProfile(comment.userId);
                }
                const userProfile = userProfiles[comment.userId] || {};
                return (
                  <li key={comment.id} className="mb-2">
                    <div className="flex items-start mb-1">
                      {userProfile.profile_pic ? (
                        <img
                          src={userProfile.profile_pic}
                          alt={`${userProfile.name} profile`}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full mr-2">
                          <FaCircleUser />
                        </div>
                      )}

                      <div>
                        <div className="p-2 bg-antique-white rounded-lg">
                          <p className="text-sm lg:text-base mr-2">
                            {userProfile.name || "Loading..."}
                          </p>
                          <p className="text-sm lg:text-base">{comment.content}</p>
                        </div>

                        <p className="text-xs lg:text-sm text-gray-500 mt-1">
                          {comment.createdAt?.toDate().toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 新增留言輸入框 */}
          {showCommentInput && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="輸入留言..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="border p-2 w-full"
              />
              <button
                onClick={() => handleAddComment(diaryId)}
                className="mt-2 p-1 bg-amber-500 text-white rounded text-xs"
              >
                送出
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewDiaryEntry;
