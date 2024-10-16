import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useReducer, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { RiNotification4Fill } from "react-icons/ri";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import logo from "../assets/images/logo-3.png";
import Alert from "../components/alert";
import { auth } from "../utils/firebase";
import {
  listenToFriendRequests,
  listenToFriends,
  listenToNotifications,
  markRequestAsRead,
  searchUserByName,
  sendFriendRequest,
} from "../utils/firebase-data";

const initialState = {
  user: null,
  searchQuery: "",
  searchResults: [],
  currentUserId: null,
  friendRequests: [],
  notifications: [],
  friendRequestsSent: [],
  friends: [],
  isSearchOpen: false,
  showNotifications: false,
  hasSearched: false,
  alertMessage: null,
  alertConfirm: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, currentUserId: action.payload?.uid };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_HAS_SEARCHED":
      return { ...state, hasSearched: action.payload };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.payload };
    case "SET_FRIEND_REQUESTS":
      return { ...state, friendRequests: action.payload };
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload };
    case "SET_FRIENDS":
      return { ...state, friends: action.payload };
    case "SET_ALERT_MESSAGE":
      return { ...state, alertMessage: action.payload };
    case "TOGGLE_SEARCH":
      return {
        ...state,
        isSearchOpen: !state.isSearchOpen,
        showNotifications: false,
        searchQuery: "",
        searchResults: [],
      };
    case "TOGGLE_NOTIFICATIONS":
      return {
        ...state,
        showNotifications: action.payload !== undefined ? action.payload : !state.showNotifications,
        isSearchOpen: false,
      };
    case "RESET_SEARCH":
      return { ...state, searchQuery: "", searchResults: [], hasSearched: false };
    case "CLEAR_ALERT":
      return { ...state, alertMessage: null };
    default:
      return state;
  }
};

function Header() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        dispatch({ type: "SET_USER", payload: currentUser });

        const unsubscribeNotifications = listenToNotifications(currentUser.uid, (notif) => {
          dispatch({ type: "SET_NOTIFICATIONS", payload: notif });
        });

        const unsubscribeFriendRequests = listenToFriendRequests(currentUser.uid, (requests) => {
          dispatch({ type: "SET_FRIEND_REQUESTS", payload: requests });
        });

        const unsubscribeFriends = listenToFriends(currentUser.uid, (friendsList) => {
          dispatch({ type: "SET_FRIENDS", payload: friendsList });
        });

        return () => {
          unsubscribeNotifications();
          unsubscribeFriendRequests();
          unsubscribeFriends();
        };
      } else {
        dispatch({ type: "SET_USER", payload: null });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogoClick = () => {
    state.user ? navigate(`/diary-calendar/${state.user.uid}`) : navigate("/");
  };

  const closeAll = () => {
    dispatch({ type: "RESET_SEARCH" });
    dispatch({ type: "TOGGLE_NOTIFICATIONS", payload: false });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-box") && !event.target.closest(".notification-box")) {
        closeAll();
      }
    };

    if (state.isSearchOpen || state.showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [state.isSearchOpen, state.showNotifications]);

  useEffect(() => {
    if (state.isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.isSearchOpen]);

  const handleNotificationClick = async (notification) => {
    try {
      if (notification.type === "comment") {
        navigate(`/view-diary/${notification.diaryId}`);
      } else if (notification.type === "reply") {
        navigate(`/community/${notification.toUserId}`);
      } else if (notification.type === "friendRequest") {
        navigate(`/community/${notification.toUserId}`);
      }

      await markRequestAsRead(notification.id);

      dispatch({
        type: "SET_NOTIFICATIONS",
        payload: state.notifications.map((notif) =>
          notif.id === notification.id ? { ...notif, isRead: true } : notif
        ),
      });
    } catch (error) {
      console.error("標記通知為已讀時發生錯誤:", error);
    }
  };

  const handleSearch = async () => {
    if (state.searchQuery.trim() === "") return;
    try {
      const results = await searchUserByName(state.searchQuery);
      dispatch({ type: "SET_SEARCH_RESULTS", payload: results });
      dispatch({ type: "SET_HAS_SEARCHED", payload: true });
    } catch (error) {
      console.error("搜尋使用者失敗：", error);
      dispatch({ type: "SET_ALERT_MESSAGE", payload: "搜尋使用者失敗，請稍後再試。" });
    }
  };

  const handleSendFriendRequest = async (targetUser) => {
    if (!state.user) {
      dispatch({ type: "SET_ALERT_MESSAGE", payload: "請先登入以發送好友邀請" });
      return;
    }

    try {
      await sendFriendRequest(state.user.uid, targetUser);
      dispatch({
        type: "SET_ALERT_MESSAGE",
        payload: `已向 ${targetUser.name} 發送好友邀請`,
      });
      setTimeout(() => {
        dispatch({ type: "CLEAR_ALERT" });
      }, 2000);
    } catch (error) {
      console.error("發送好友邀請失敗：", error);
      dispatch({ type: "SET_ALERT_MESSAGE", payload: "發送好友邀請失敗，請稍後再試。" });
    }
  };

  const isFriend = (userId) => state.friends.some((friend) => friend.id === userId);

  const shouldHideIcons = location.pathname === "/";

  return (
    <header className="w-screen sticky z-30 top-0 h-[60px] lg:h-[90px] bg-light-yellow py-4 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <img
          src={logo}
          className="h-10 lg:h-14 cursor-pointer"
          onClick={handleLogoClick}
          alt="Logo"
        />
      </div>
      <div className="relative">
        {!shouldHideIcons && (
          <>
            <button
              className="text-dark-blue mr-4"
              onClick={() => dispatch({ type: "TOGGLE_SEARCH" })}
            >
              <FaSearch className="h-6 w-6 lg:h-8 lg:w-8" />
            </button>
            <button
              className="text-dark-blue relative"
              onClick={() => dispatch({ type: "TOGGLE_NOTIFICATIONS" })}
            >
              <RiNotification4Fill className="h-6 w-6 lg:h-8 lg:w-8" />

              {state.notifications.some((notification) => !notification.isRead) && (
                <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
              )}
            </button>

            {state.showNotifications && (
              <div className="absolute right-0 mt-2 w-72 z-40 bg-white shadow-lg p-4 rounded-lg notification-box">
                <h4 className="text-lg mb-2">通知</h4>
                <p className="text-sm mb-2 text-gray-600">點擊通知將其標記為已讀</p>
                {state.notifications.length > 0 ? (
                  <ul>
                    {state.notifications.map((notification) => (
                      <li
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`border-b p-2 cursor-pointer ${
                          notification.isRead ? "bg-gray-100 text-gray-400" : "bg-white text-black"
                        }`}
                      >
                        {notification.type === "friendRequest" &&
                          `${notification.fromUserName} 發送了好友邀請`}
                        {notification.type === "comment" &&
                          `你收到了新留言：${notification.commentContent}`}
                        {notification.type === "reply" &&
                          `${notification.fromUserName} 回覆了你的留言：${notification.replyContent}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm">暫無通知</p>
                )}
              </div>
            )}
          </>
        )}

        {state.isSearchOpen && (
          <div className="z-40 absolute top-12 right-0 bg-white shadow-lg p-2 rounded w-[300px] search-box">
            <input
              type="text"
              value={state.searchQuery}
              ref={inputRef}
              onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })}
              placeholder="搜尋使用者名稱"
              className="w-full p-2 border border-gray-300 rounded"
            />
            <button
              onClick={handleSearch}
              className="w-full mt-2 p-2 bg-dark-blue text-white rounded"
            >
              搜尋
            </button>

            {state.searchResults.length > 0 && (
              <ul className="mt-2">
                {state.searchResults.map((result) => {
                  const alreadyFriend = isFriend(result.id);
                  const alreadySent = state.friendRequestsSent.includes(result.id);
                  const isSelf = result.id === state.currentUserId;

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
            {state.hasSearched && state.searchResults.length === 0 && (
              <p className="mt-2 text-sm text-gray-600">未有該用戶資料</p>
            )}
            {!state.hasSearched && state.searchQuery.trim() !== "" && (
              <p className="mt-2 text-sm text-gray-600">按下搜尋開始尋找</p>
            )}
          </div>
        )}
      </div>
      {state.alertMessage && (
        <Alert
          message={state.alertMessage}
          onClose={() => dispatch({ type: "CLEAR_ALERT" })}
          onConfirm={state.alertConfirm}
        />
      )}
    </header>
  );
}

export default Header;
