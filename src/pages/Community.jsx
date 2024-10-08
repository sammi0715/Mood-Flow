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
  addComment,
  fetchComments,
  toggleLikeDiary,
  deleteFriend,
} from "../utills/firebase-data";
import moodIcons from "../utills/moodIcons";
import { FaRegHeart, FaHeart, FaRegComment, FaSearch } from "react-icons/fa";
import { IoIosClose, IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { IoCloseCircle } from "react-icons/io5";
import { auth } from "../utills/firebase";
import { LiaUserFriendsSolid } from "react-icons/lia";
import { RiUser5Fill } from "react-icons/ri";
import Sidebar from "../pages/Sidebar";
import { TiThMenu } from "react-icons/ti";
import Alert from "./../utills/alert";
import Confirm from "./../utills/confirm";
function Community() {
  const [friends, setFriends] = useState([]);
  const [isFriendsListOpen, setIsFriendsListOpen] = useState(true);
  const [friendRequests, setFriendRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedFriendDiaries, setSelectedFriendDiaries] = useState([]);
  const [loadingDiaries, setLoadingDiaries] = useState(false);
  const [error, setError] = useState(null);
  const [commentTexts, setCommentTexts] = useState("");
  const [diaryComments, setDiaryComments] = useState({});
  const [likeStatuses, setLikeStatuses] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({});
  const [userProfiles, setUserProfiles] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertConfirm, setAlertConfirm] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  const { userId } = useParams();

  useEffect(() => {
    if (userId) {
      const unsubscribe = listenToFriends(userId, setFriends);
      return () => unsubscribe();
    }
  }, [userId]);

  // 設置實時監聽好友請求
  useEffect(() => {
    if (userId) {
      const unsubscribe = listenToFriendRequests(userId, setFriendRequests);
      return () => unsubscribe();
    }
  }, [userId]);

  // 獲取選定好友的日記
  useEffect(() => {
    if (selectedFriend && userId) {
      const fetchSelectedFriendDiaries = async () => {
        setLoadingDiaries(true);
        setError(null);
        try {
          const diaries = await fetchDiariesWithPermission(userId, selectedFriend.userId);
          setSelectedFriendDiaries(diaries);
          diaries.forEach(async (diary) => {
            const comments = await fetchComments(diary.id);
            setDiaryComments((prev) => ({ ...prev, [diary.id]: comments }));

            setLikeStatuses((prev) => ({ ...prev, [diary.id]: diary.likes || [] }));
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

  const handleAddComment = async (diaryId) => {
    const commentText = commentTexts[diaryId];
    if (!commentText?.trim()) return;
    if (!auth.currentUser) {
      setAlertMessage("請先登入才能執行此操作");
      return;
    }
    try {
      await addComment(diaryId, commentText);
      const updatedComments = await fetchComments(diaryId);
      setDiaryComments((prev) => ({ ...prev, [diaryId]: updatedComments }));
      setCommentTexts((prev) => ({ ...prev, [diaryId]: "" }));
    } catch (error) {
      console.error("添加留言時出錯:", error);
    }
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

  const handleCommentTextChange = (diaryId, text) => {
    setCommentTexts((prev) => ({ ...prev, [diaryId]: text }));
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
                <p className="text-sm lg:text-base mt-6">暫無好友邀請～</p>
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
                            className="w-6 h-6 mr-2"
                          />
                          <p>{diary.mood}</p>
                        </div>
                        <p className="text-sm lg:text-base">{diary.content}</p>

                        <p className="text-xs lg:text-sm text-right text-gray-500"> {diary.date}</p>
                        <div className="flex items-center space-x-4">
                          {" "}
                          <button
                            onClick={() => handleToggleLike(diary.id)}
                            className="text-red-600 rounded flex items-center"
                          >
                            {likeStatuses[diary.id]?.includes(auth.currentUser.uid) ? (
                              <FaHeart />
                            ) : (
                              <FaRegHeart />
                            )}
                            <span className="ml-2">{likeStatuses[diary.id]?.length || 0}</span>{" "}
                          </button>
                          <button
                            className="text-black flex items-center"
                            onClick={() => handleToggleCommentInput(diary.id)}
                          >
                            <FaRegComment />
                            <span className="ml-2">{diaryComments[diary.id]?.length || 0}</span>
                          </button>
                        </div>

                        {/* Comments */}

                        <ul className="mt-4">
                          {diaryComments[diary.id]?.map((comment) => {
                            if (!userProfiles[comment.userId]) {
                              fetchUserProfile(comment.userId);
                            }
                            const userProfile = userProfiles[comment.userId] || {};
                            return (
                              <li key={comment.id} className="mb-2 p-2 bg-antique-white rounded">
                                <div className="flex items-center mb-1">
                                  {userProfile.profile_pic ? (
                                    <img
                                      src={userProfile.profile_pic}
                                      alt={`${userProfile.name} profile`}
                                      className="w-6 h-6 rounded-full mr-2"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-light-beige mr-2"></div> //使用者頭貼預設
                                  )}
                                  <p className="text-sm lg:text-base  mr-2">
                                    {userProfile.name || "Loading..."}
                                  </p>
                                  <p className="text-xs lg:text-sm text-gray-500">
                                    {comment.createdAt?.toDate().toLocaleString()}
                                  </p>
                                </div>
                                <p className="text-sm lg:text-base">{comment.content}</p>
                              </li>
                            );
                          })}
                        </ul>

                        {/* Add Comment */}
                        {showCommentInput[diary.id] && (
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="輸入留言..."
                              value={commentTexts[diary.id] || ""}
                              onChange={(e) => handleCommentTextChange(diary.id, e.target.value)}
                              className="border p-2 w-full"
                            />
                            <button
                              onClick={() => handleAddComment(diary.id)}
                              className="mt-2 p-1 bg-amber-500 text-white rounded text-xs"
                            >
                              送出
                            </button>
                          </div>
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
                className="mt-4
              "
              >
                請選擇一位好友以查看他們的日記動態！
              </p>
            )}
            {/* 錯誤訊息顯示 */}
            {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
          </div>
        </div>{" "}
      </div>
    </div>
  );
}

export default Community;
