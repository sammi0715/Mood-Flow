import React, { useState, useEffect } from "react";
import logo from "../assets/images/logo-3.png";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth } from "../utills/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { RiNotification4Fill } from "react-icons/ri";
import { searchUserByName, sendFriendRequest } from "../utills/firebase-data";
import { listenToFriendRequests, markRequestAsRead } from "../utills/firebase-data";

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setCurrentUserId(currentUser.uid);

        const unsubscribeFriendRequests = listenToFriendRequests(currentUser.uid, (requests) => {
          setFriendRequests(requests);
        });

        return () => {
          unsubscribeFriendRequests();
        };
      } else {
        setUser(null);
        setCurrentUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogoClick = () => {
    if (user) {
      navigate(`/diary-calendar/${user.uid}`);
    } else {
      navigate("/");
    }
  };

  // 切換搜尋框顯示與隱藏
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    setSearchResults([]);
  };

  // 搜尋使用者
  const handleSearch = async () => {
    if (searchQuery.trim() === "") return;
    const results = await searchUserByName(searchQuery);
    setSearchResults(results);
  };

  // 發送好友邀請
  const handleSendFriendRequest = async (targetUser) => {
    if (!user) return alert("請先登入以發送好友邀請");

    try {
      await sendFriendRequest(user.uid, targetUser); // 發送好友邀請
      alert(`已向 ${targetUser.name} 發送好友邀請`);
    } catch (error) {
      console.error("發送好友邀請失敗：", error);
      alert("發送好友邀請失敗，請稍後再試。");
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationClick = async (requestId) => {
    try {
      await markRequestAsRead(currentUserId, requestId);
      setFriendRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === requestId ? { ...request, isRead: true } : request
        )
      );
    } catch (error) {
      console.error("標記通知為已讀時發生錯誤:", error);
    }
  };

  return (
    <header className="w-screen h-[90px] bg-amber-100 py-4 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <img src={logo} className="h-14 cursor-pointer" onClick={handleLogoClick} alt="Logo" />
      </div>
      <div className="relative">
        {user && (
          <>
            <button className="text-gray-600 mr-4" onClick={toggleSearch}>
              <FaSearch className="h-8 w-8" />
            </button>
            <button className="text-gray-600 relative" onClick={toggleNotifications}>
              <RiNotification4Fill className="h-8 w-8" />
              {/* 如果有未讀通知，顯示紅點 */}
              {friendRequests.some((request) => !request.isRead) && (
                <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* 通知下拉菜單 */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72  z-10 bg-white shadow-lg p-4 rounded-lg">
                <h4 className="text-lg font-bold mb-2">通知</h4>
                <p className="text-sm mb-2 text-gray-600">點擊通知將其標記為已讀</p>
                {friendRequests.length > 0 ? (
                  <ul>
                    {friendRequests.map((request) => (
                      <li
                        key={request.id}
                        onClick={() => handleNotificationClick(request.id)}
                        className={`border-b p-2 cursor-pointer ${
                          request.isRead ? "text-gray-400" : "text-black"
                        }`}
                      >
                        {request.name} 發送了好友邀請
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm">暫無新通知</p>
                )}
              </div>
            )}
          </>
        )}

        {/* 搜尋框，當 isSearchOpen 為 true 時顯示 */}
        {isSearchOpen && user && (
          <div className=" z-10 absolute top-12 right-0 bg-white shadow-lg p-2 rounded w-[300px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋使用者名稱"
              className="w-full p-2 border border-gray-300 rounded"
            />
            <button
              onClick={handleSearch}
              className="w-full mt-2 p-2 bg-blue-500 text-white rounded"
            >
              搜尋
            </button>

            {/* 顯示搜尋結果 */}
            {searchResults.length > 0 && (
              <ul className="mt-2">
                {searchResults.map((result) => (
                  <li key={result.id} className="p-2 border-b flex justify-between items-center">
                    <span>
                      {result.name} ({result.email}){result.userId === currentUserId && " (自己)"}
                    </span>
                    {result.userId !== currentUserId && (
                      <button
                        onClick={() => handleSendFriendRequest(result)}
                        className={`text-sm ${
                          result.privacy_status === "private" ? "bg-gray-500" : "bg-amber-500"
                        } w-24 text-white rounded ${
                          result.privacy_status === "private"
                            ? "cursor-not-allowed"
                            : "hover:bg-amber-700"
                        }`}
                        disabled={result.privacy_status === "private"}
                        title={
                          result.privacy_status === "private"
                            ? "這是一個私人帳戶，無法發送好友邀請"
                            : "發送好友邀請"
                        }
                      >
                        {result.privacy_status === "private" ? "私人帳戶" : "發送邀請"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
