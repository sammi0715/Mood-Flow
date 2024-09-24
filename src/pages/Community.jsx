import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  fetchFriends,
  fetchFriendRequests,
  sendFriendRequest,
  searchUserByName,
  acceptFriendRequest,
  deleteFriendRequest,
  fetchDiaries,
  fetchDiariesWithPermission,
  fetchUserData,
  listenToFriends,
  listenToFriendRequests,
} from "../utills/firebase-data";
import moodIcons from "../utills/moodIcons";
import { auth } from "../utills/firebase";
function Community() {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedFriendDiaries, setSelectedFriendDiaries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingDiaries, setLoadingDiaries] = useState(false);
  const [error, setError] = useState(null);
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

  // 處理搜尋
  const handleSearch = async () => {
    if (searchQuery.trim() === "") return;
    try {
      const results = await searchUserByName(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error("搜尋使用者時出錯：", err);
      setError("搜尋使用者時出錯，請稍後再試。");
    }
  };

  // 發送好友邀請
  const handleSendFriendRequest = async (targetUser) => {
    try {
      await sendFriendRequest(userId, targetUser);
      alert("好友邀請已發送！");
    } catch (err) {
      console.error("發送好友邀請失敗：", err);
      setError("發送好友邀請失敗，請稍後再試。");
    }
  };

  const handleAcceptFriendRequest = async (request) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("用戶未登錄");
      return;
    }

    try {
      await acceptFriendRequest(request.userId, currentUser.uid);
      await deleteFriendRequest(currentUser.uid, request.id);
      alert("雙方已成為好友");

      // 刷新好友列表
      const updatedFriends = await fetchFriends(currentUser.uid);
      setFriends(updatedFriends);

      // 移除已接受的好友请求
      setFriendRequests((prevRequests) => prevRequests.filter((req) => req.id !== request.id));
    } catch (error) {
      console.error("接受好友邀請時錯誤：", error);
      setError("接受好友邀請時錯誤，請稍後再試。");
    }
  };

  // 拒絕好友邀請
  const handleRejectFriendRequest = async (requestId) => {
    try {
      await deleteFriendRequest(userId, requestId);
      alert("好友邀請已刪除！");
    } catch (err) {
      console.error("刪除好友邀請失敗：", err);
      setError("刪除好友邀請失敗，請稍後再試。");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左側：好友列表 */}
      <div className="w-60 bg-gray-100 p-4">
        <h2 className="text-xl font-bold mb-4">好友列表</h2>
        <ul>
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="cursor-pointer p-2 hover:bg-gray-300"
              onClick={() => handleSelectFriend(friend)}
            >
              {friend.name}
            </li>
          ))}
        </ul>
      </div>

      {/* 右側：好友日記動態、好友邀請、搜尋功能 */}
      <div className="flex-1 p-4 overflow-auto">
        {/* 好友邀請通知 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">好友邀請</h2>
          <ul>
            {friendRequests.length > 0 ? (
              friendRequests.map((request) => (
                <li key={request.id} className="mb-2">
                  <span>
                    {request.name} ({request.email}) - {request.status}
                  </span>
                  <button
                    onClick={() => handleAcceptFriendRequest(request)}
                    className="ml-4 p-2 bg-blue-500 text-white rounded"
                  >
                    接受
                  </button>
                  <button
                    onClick={() => handleRejectFriendRequest(request.id)}
                    className="ml-2 p-2 bg-red-500 text-white rounded"
                  >
                    X
                  </button>
                </li>
              ))
            ) : (
              <p>暫無好友邀請。</p>
            )}
          </ul>
        </div>

        {/* 好友日記動態 */}
        {selectedFriend ? (
          <div>
            <h2 className="text-xl mb-4">{selectedFriend.name} 的日記動態</h2>
            {loadingDiaries ? (
              <p>正在載入日記...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : selectedFriendDiaries.length > 0 ? (
              <ul>
                {selectedFriendDiaries.map((diary) => (
                  <li key={diary.id} className="mb-2 p-2 bg-gray-50 rounded">
                    <div className="flex items-center mb-2">
                      {selectedFriend.profile_pic ? (
                        <img
                          src={selectedFriend.profile_pic}
                          alt={`${selectedFriend.name} profile pic`}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
                      )}
                      <p className="font-bold">{selectedFriend.name}</p>
                    </div>

                    <div className="flex items-center mt-2">
                      <img src={moodIcons[diary.mood]} alt={diary.mood} className="w-6 h-6 mr-2" />
                      <p>{diary.mood}</p>
                    </div>
                    <p>{diary.content}</p>

                    <p className="text-sm text-gray-500"> {diary.date}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>這位好友還沒有日記。</p>
            )}
          </div>
        ) : (
          <p>請選擇一位好友以查看他們的日記動態。</p>
        )}

        {/* 錯誤訊息顯示 */}
        {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
      </div>
    </div>
  );
}

export default Community;
