import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  fetchFriends,
  acceptFriendRequest,
  deleteFriendRequest,
  fetchDiariesWithPermission,
  fetchUserData,
  listenToFriends,
  listenToFriendRequests,
  listenToComments,
  toggleLikeDiary,
  deleteFriend,
} from "../utills/firebase-data";
import moodIcons from "../utills/moodIcons";
import { auth, doc, onSnapshot } from "../utills/firebase";
import { db } from "../utills/firebase";
import Sidebar from "../pages/Sidebar";
import Alert from "../components/alert";
import Confirm from "../components/confirm";
import LikeTooltip from "../components/LikeTooltip";
import { FaRegComment, FaSearch } from "react-icons/fa";
import { IoIosClose, IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { IoCloseCircle } from "react-icons/io5";
import { RiUser5Fill } from "react-icons/ri";
import { TiThMenu } from "react-icons/ti";
import CommentSection from "../components/CommentSection";
import Music from "../assets/images/music-note.png";
function Community() {
  const [friends, setFriends] = useState([]);
  const [isFriendsListOpen, setIsFriendsListOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedFriendDiaries, setSelectedFriendDiaries] = useState([]);
  const [loadingDiaries, setLoadingDiaries] = useState(false);
  const [error, setError] = useState(null);
  const [diaryComments, setDiaryComments] = useState({});
  const [likeStatuses, setLikeStatuses] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertConfirm, setAlertConfirm] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  const { userId } = useParams();

  useEffect(() => {
    if (userId) {
      const unsubscribe = listenToFriends(userId, (updatedFriends) => {
        setFriends(updatedFriends);

        if (selectedFriend) {
          const isStillFriend = updatedFriends.some((friend) => friend.id === selectedFriend.id);
          if (!isStillFriend) {
            setSelectedFriend(null);
            setAlertMessage("你已被移除好友，無法繼續查看內容");
          }
        }
      });

      return () => unsubscribe();
    }
  }, [userId, selectedFriend]);

  useEffect(() => {
    if (userId) {
      const unsubscribe = listenToFriendRequests(userId, setFriendRequests);
      return () => unsubscribe();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedFriend && userId) {
      const fetchSelectedFriendDiaries = async () => {
        setLoadingDiaries(true);
        setError(null);
        try {
          const diaries = await fetchDiariesWithPermission(userId, selectedFriend.userId);
          setSelectedFriendDiaries(diaries);

          diaries.forEach((diary) => {
            const diaryRef = doc(db, "diaries", diary.id);
            const unsubscribeLikes = onSnapshot(diaryRef, (snapshot) => {
              if (snapshot.exists()) {
                const diaryData = snapshot.data();
                setLikeStatuses((prev) => ({
                  ...prev,
                  [diary.id]: diaryData.likes || [],
                }));
              }
            });

            const unsubscribeComments = listenToComments(diary.id, (updatedComments) => {
              setDiaryComments((prev) => ({ ...prev, [diary.id]: updatedComments }));
            });

            return () => {
              unsubscribeComments();
              unsubscribeLikes();
            };
          });
        } catch (err) {
          console.error("獲取好友日記出錯:", err);
          setError("獲取好友日記出錯，請稍後再試。");
        } finally {
          setLoadingDiaries(false);
        }
      };

      fetchSelectedFriendDiaries();
    } else {
      setSelectedFriendDiaries([]);
    }
  }, [selectedFriend, userId]);

  const handleSelectFriend = async (friend) => {
    try {
      const friendUserData = await fetchUserData(friend.userId);

      setSelectedFriend({
        ...friend,
        ...friendUserData,
      });
    } catch (err) {
      console.error("獲取數據時出錯：", err);
      setError("獲取好友資料時出錯，請稍後再試。");
    }
  };

  const handleAcceptFriendRequest = async (request) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setAlertMessage("用戶未登錄");
      return;
    }

    try {
      await acceptFriendRequest(request.userId, currentUser.uid);
      await deleteFriendRequest(currentUser.uid, request.id);

      setAlertMessage("雙方已成為好友");

      const updatedFriends = await fetchFriends(currentUser.uid);
      setFriends(updatedFriends);

      setFriendRequests((prevRequests) => prevRequests.filter((req) => req.id !== request.id));
    } catch (error) {
      console.error("接受好友邀請時錯誤：", error);
      setError("接受好友邀請時錯誤，請稍後再試。");
    }
  };

  const handleDeleteFriend = (friendId) => {
    setConfirmMessage("確定要刪除這位好友嗎？");
    setOnConfirmAction(() => async () => {
      try {
        await deleteFriend(userId, friendId);
        setAlertMessage("好友已刪除");

        // 更新好友列表
        const updatedFriends = friends.filter((friend) => friend.id !== friendId);
        setFriends(updatedFriends);

        // 檢查並清空已選中的好友
        if (selectedFriend?.id === friendId) {
          setSelectedFriend(null);
        }
      } catch (error) {
        console.error("刪除好友時發生錯誤:", error);
        setAlertMessage("刪除好友時發生錯誤，請稍後再試。");
      } finally {
        setShowConfirmDialog(false);
      }
    });
    setShowConfirmDialog(true);
  };

  const handleRejectFriendRequest = (requestId) => {
    setConfirmMessage("確定要拒絕這個好友邀請嗎？");
    setOnConfirmAction(() => async () => {
      try {
        await deleteFriendRequest(userId, requestId);
        setAlertMessage("好友邀請已刪除！");
      } catch (err) {
        console.error("刪除好友邀請失敗：", err);
        setError("刪除好友邀請失敗，請稍後再試。");
      } finally {
        setShowConfirmDialog(false);
      }
    });
    setShowConfirmDialog(true);
  };

  const handleToggleCommentInput = (diaryId) => {
    setShowCommentInput((prev) => ({
      ...prev,
      [diaryId]: !prev[diaryId],
    }));
  };

  const handleToggleLike = async (diaryId) => {
    try {
      const currentLikes = likeStatuses[diaryId] || [];
      await toggleLikeDiary(diaryId, currentLikes);

      const updatedLikes = currentLikes.includes(auth.currentUser.uid)
        ? currentLikes.filter((id) => id !== auth.currentUser.uid)
        : [...currentLikes, auth.currentUser.uid];
      setLikeStatuses((prev) => ({ ...prev, [diaryId]: updatedLikes }));
    } catch (error) {
      console.error("更新按讚狀態時出錯:", error);
    }
  };

  const toggleFriendsList = () => {
    setIsFriendsListOpen(!isFriendsListOpen);
  };

  return (
    <div className="min-h-screen flex flex-row-reverse">
      {alertMessage && (
        <Alert
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
          onConfirm={alertConfirm}
        />
      )}
      {showConfirmDialog && (
        <Confirm
          message={confirmMessage}
          onConfirm={onConfirmAction}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}

      <div
        className={`fixed  right-0 h-screen bg-light-green transition-transform duration-300 ${
          isFriendsListOpen ? "translate-x-full" : "translate-x-0"
        } w-48 lg:w-60 p-4`}
      >
        <button
          className="absolute top-4 right-100 flex items-center cursor-pointer text-xl"
          onClick={toggleFriendsList}
        >
          <IoIosArrowForward className="text-black" />
        </button>

        <div className="p-2">
          <h2 className="text-base lg:text-xl mt-4 lg:mt-6 ml-4">好友列表</h2>
          <h3 className="flex items-center text-xs lg:text-sm mb-4 lg:mt-6 ml-4 text-gray-600">
            <FaSearch className="mr-1" />
            點擊上方搜尋好友
          </h3>
          <ul>
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="cursor-pointer min-w-[92px] p-1 hover:bg-light-yellow hover:rounded-md items-center flex justify-between text-base"
                onClick={() => handleSelectFriend(friend)}
              >
                {friend.name}
                <button
                  className="ml-2 text-white rounded "
                  onClick={() => handleDeleteFriend(friend.id)}
                >
                  <IoIosClose className="text-black w-4 h-4 lg:w-6 lg:h-6" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* 好友邀請通知 */}
        <div className="mb-6">
          <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          <div className="p-8">
            <div className="flex items-center space-x-3 justify-between">
              <TiThMenu
                className="w-6 h-6 lg:h-8 lg:w-8 mr-4 cursor-pointer text-gray-600 hover:text-gray-800"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
              <h2 className="text-lg lg:text-2xl ml-4 text-left flex-1">好友邀請</h2>
              <button className="text-2xl flex items-center" onClick={toggleFriendsList}>
                <IoIosArrowBack className="text-dark-green" />
                <RiUser5Fill className=" w-8 h-8 text-dark-green text-center items-center" />
              </button>
            </div>
            <ul className="mt-4">
              {friendRequests.length > 0 ? (
                friendRequests.map((request) => (
                  <li
                    key={request.id}
                    className="mb-4 flex justify-between items-center bg-white p-2 rounded-lg shadow-md xl:w-[45%] lg:w-[45%] md:w-[45%]"
                  >
                    <div className="flex items-center">
                      <span className="text-lg font-medium">{request.name}</span>
                      <span className="text-gray-500 ml-2">({request.email})</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptFriendRequest(request)}
                        className="ml-2 md:ml-4 p-1 text-xs lg:text-base bg-dark-orange text-white rounded "
                      >
                        接受
                      </button>
                      <button
                        onClick={() => handleRejectFriendRequest(request.id)}
                        className="text-white rounded items-center"
                      >
                        <IoCloseCircle className="w-7 h-7 text-pink-orange ml-4" />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-sm lg:text-base mt-6 lg:text-xl">暫無好友邀請～</p>
              )}
            </ul>

            {/* 好友日記動態 */}
            {selectedFriend ? (
              <div>
                <h2 className="text-lg lg:text-xl mb-4 mt-10">{selectedFriend.name} 的日記動態</h2>
                {loadingDiaries ? (
                  <p>正在載入日記...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : selectedFriendDiaries.length > 0 ? (
                  <ul>
                    {selectedFriendDiaries.map((diary) => (
                      <li key={diary.id} className="mb-2 p-4 bg-light-beige rounded">
                        <div className="flex items-center mb-2">
                          {selectedFriend.profile_pic ? (
                            <img
                              src={selectedFriend.profile_pic}
                              alt={`${selectedFriend.name} profile pic`}
                              className="w-12 h-12 rounded-full mr-2"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-light-beige mr-2"></div>
                          )}
                          <p>{selectedFriend.name}</p>
                        </div>
                        <div className="flex items-center mt-2">
                          <img
                            src={moodIcons[diary.mood]}
                            alt={diary.mood}
                            className="w-8 h-8 mr-2"
                          />
                          <p>{diary.mood}</p>
                        </div>

                        {diary.track && (
                          <div className="mt-4 flex items-center">
                            <img src={Music} className="w-5 h-5 mr-2 animate-bounce-custom" />
                            <p className="text-sm md:text-base mr-2">
                              {diary.track.artists.join(", ")}
                            </p>
                            -<p className="text-sm md:text-base ml-2">{diary.track.name}</p>
                          </div>
                        )}
                        <p className="mt-4 mb-4 text-sm lg:text-base break-words whitespace-pre-wrap">
                          {diary.content}
                        </p>
                        {/* 顯示圖片 */}
                        {diary.imageUrls && diary.imageUrls.length > 0 && (
                          <div className="mt-4">
                            {diary.imageUrls.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`日記圖片 ${index + 1}`}
                                className="w-[200px] h-auto mb-2 rounded"
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-xs lg:text-sm text-right text-gray-500"> {diary.date}</p>
                        <div className="flex items-center space-x-4">
                          <LikeTooltip
                            diaryId={diary.id}
                            likes={likeStatuses[diary.id] || []}
                            userId={auth.currentUser?.uid}
                            toggleLike={handleToggleLike}
                          />

                          <button
                            className="text-black flex items-center"
                            onClick={() => handleToggleCommentInput(diary.id)}
                          >
                            <FaRegComment />
                            <span className="ml-2">{diaryComments[diary.id]?.length || 0}</span>
                          </button>
                        </div>

                        {showCommentInput[diary.id] && (
                          <CommentSection
                            diaryId={diary.id}
                            diaryOwnerId={diary.userId}
                            currentUserId={auth.currentUser?.uid}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>這位好友還沒有日記～</p>
                )}
              </div>
            ) : (
              <p
                className="mt-4 lg:text-xl 
              "
              >
                點擊右側選單選擇一位好友以查看他們的日記動態！
              </p>
            )}

            {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Community;
