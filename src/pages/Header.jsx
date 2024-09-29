import React, { useState, useEffect } from "react";
import logo from "../assets/images/logo-3.png";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth } from "../utills/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { RiNotification4Fill } from "react-icons/ri";
import { searchUserByName, sendFriendRequest, listenToFriends } from "../utills/firebase-data";
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
  const [friendRequestsSent, setFriendRequestsSent] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setCurrentUserId(currentUser.uid);

        // 監聽好友請求
        const unsubscribeFriendRequests = listenToFriendRequests(currentUser.uid, (requests) => {
          setFriendRequests(requests);

          const sentRequests = requests
            .filter((request) => request.status === "pending")
            .map((request) => request.userId);
          setFriendRequestsSent(sentRequests);
        });

        // 監聽好友列表
        const unsubscribeFriends = listenToFriends(currentUser.uid, (friendsList) => {
          setFriends(friendsList);
        });

        return () => {
          unsubscribeFriendRequests();
          unsubscribeFriends();
        };
      } else {
        setUser(null);
        setCurrentUserId(null);
        setFriends([]);
        setFriendRequests([]);
        setFriendRequestsSent([]);
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

  const closeAll = () => {
    setIsSearchOpen(false);
    setShowNotifications(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-box") && !event.target.closest(".notification-box")) {
        closeAll();
      }
    };

    if (isSearchOpen || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen, showNotifications]);

  // 切換搜尋框顯示與隱藏
  const toggleSearch = () => {
    setIsSearchOpen((prev) => {
      if (prev) return false;
      setShowNotifications(false);
      return true;
    });
  };

  // 搜尋使用者
  const handleSearch = async () => {
    if (searchQuery.trim() === "") return;
    try {
      const results = await searchUserByName(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("搜尋使用者失敗：", error);
      alert("搜尋使用者失敗，請稍後再試。");
    }
  };

  // 發送好友邀請
  const handleSendFriendRequest = async (targetUser) => {
    if (!user) return alert("請先登入以發送好友邀請");

    try {
      await sendFriendRequest(user.uid, targetUser);
      setFriendRequestsSent((prev) => [...prev, targetUser.id]);
      alert(`已向 ${targetUser.name} 發送好友邀請`);
    } catch (error) {
      console.error("發送好友邀請失敗：", error);
      alert("發送好友邀請失敗，請稍後再試。");
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => {
      if (prev) return false;
      setIsSearchOpen(false);
      return true;
    });
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

  // 判斷是否已為好友
  const isFriend = (userId) => {
    return friends.some((friend) => friend.id === userId);
  };

  return (
    <header className="w-screen h-[90px] bg-amber-100 py-4 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <img
          src={logo}
          className="h-10 lg:h-14 cursor-pointer"
          onClick={handleLogoClick}
          alt="Logo"
        />
      </div>
      <div className="relative">
        {user && (
          <>
            <button className="text-gray-600 mr-4" onClick={toggleSearch}>
              <FaSearch className="h-6 w-6 lg:h-8 lg:w-8" />
            </button>
            <button className="text-gray-600 relative" onClick={toggleNotifications}>
              <RiNotification4Fill className="h-6 w-6 lg:h-8 lg:w-8" />
              {/* 如果有未讀通知，顯示紅點 */}
              {friendRequests.some((request) => !request.isRead) && (
                <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* 通知下拉菜單 */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 z-10 bg-white shadow-lg p-4 rounded-lg notification-box">
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
          <div className="z-10 absolute top-12 right-0 bg-white shadow-lg p-2 rounded w-[300px] search-box">
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
                {searchResults.map((result) => {
                  const alreadyFriend = isFriend(result.id);
                  const alreadySent = friendRequestsSent.includes(result.id);
                  const isSelf = result.id === currentUserId;

                  return (
                    <li key={result.id} className="p-2 border-b flex justify-between items-center">
                      <span>
                        {result.name} ({result.email}) {isSelf && " (自己)"}
                      </span>
                      {!isSelf && (
                        <button
                          onClick={() => handleSendFriendRequest(result)}
                          className={`text-sm ${
                            result.privacy_status === "private" || alreadyFriend
                              ? "bg-gray-500 cursor-not-allowed"
                              : alreadySent
                              ? "bg-gray-500 cursor-not-allowed"
                              : "bg-amber-500 hover:bg-amber-700"
                          } w-24 text-white rounded`}
                          disabled={
                            result.privacy_status === "private" || alreadyFriend || alreadySent
                          }
                          title={
                            result.privacy_status === "private"
                              ? "這是一個私人帳戶，無法發送好友邀請"
                              : alreadyFriend
                              ? "你們已經是好友"
                              : alreadySent
                              ? "好友邀請已發送"
                              : "發送好友邀請"
                          }
                        >
                          {result.privacy_status === "private"
                            ? "私人帳戶"
                            : alreadyFriend
                            ? "已為好友"
                            : alreadySent
                            ? "已發送"
                            : "發送邀請"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* 顯示搜尋結果為空的情況 */}
            {searchResults.length === 0 && searchQuery.trim() !== "" && (
              <p className="mt-2 text-sm text-gray-600">按下搜尋開始尋找</p>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
