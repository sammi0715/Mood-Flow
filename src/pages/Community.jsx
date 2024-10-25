import React, { useEffect } from "react";
import { FaRegComment, FaSearch } from "react-icons/fa";
import { IoIosArrowBack, IoIosArrowForward, IoIosClose } from "react-icons/io";
import { IoCloseCircle } from "react-icons/io5";
import { RiUser5Fill } from "react-icons/ri";
import { TiThMenu } from "react-icons/ti";
import { useParams } from "react-router-dom";
import { useAppContext } from "../AppContext";
import Music from "../assets/images/music-note.png";
import CommentSection from "../components/CommentSection";
import LikeTooltip from "../components/LikeTooltip";
import Alert from "../components/alert";
import Confirm from "../components/confirm";
import Sidebar from "../pages/Sidebar";
import { auth, db, doc, onSnapshot } from "../utils/firebase";
import {
  acceptFriendRequest,
  deleteFriend,
  deleteFriendRequest,
  fetchDiariesWithPermission,
  fetchFriends,
  fetchUserData,
  listenToComments,
  listenToFriendRequests,
  listenToFriends,
  toggleLikeDiary,
} from "../utils/firebase-data";
import moodIcons from "../utils/moodIcons";

function Community() {
  const { state, dispatch } = useAppContext();

  const { userId } = useParams();

  useEffect(() => {
    if (userId) {
      const unsubscribe = listenToFriends(userId, (updatedFriends) => {
        dispatch({ type: "SET_FRIENDS", payload: updatedFriends });

        if (state.community.selectedFriend) {
          const isStillFriend = updatedFriends.some(
            (friend) => friend.id === state.community.selectedFriend.id
          );
          if (!isStillFriend) {
            dispatch({ type: "SET_SELECTED_FRIEND", payload: null });
            dispatch({
              type: "SET_ALERT",
              payload: { message: "你已被移除好友，無法繼續查看內容" },
            });
          }
        }
      });

      return () => unsubscribe();
    }
  }, [userId, state.community.selectedFriend]);

  useEffect(() => {
    if (userId) {
      const unsubscribe = listenToFriendRequests(userId, (requests) => {
        dispatch({ type: "SET_FRIEND_REQUESTS", payload: requests });
      });
      return () => unsubscribe();
    }
  }, [userId]);

  useEffect(() => {
    if (state.community.selectedFriend && userId) {
      const fetchSelectedFriendDiaries = async () => {
        dispatch({ type: "SET_LOADING_DIARIES", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });
        try {
          const diaries = await fetchDiariesWithPermission(
            userId,
            state.community.selectedFriend.userId
          );
          dispatch({ type: "SET_SELECTED_FRIEND_DIARIES", payload: diaries });

          diaries.forEach((diary) => {
            const diaryRef = doc(db, "diaries", diary.id);
            const unsubscribeLikes = onSnapshot(diaryRef, (snapshot) => {
              if (snapshot.exists()) {
                const diaryData = snapshot.data();
                dispatch({
                  type: "SET_LIKE_STATUSES",
                  payload: { [diary.id]: diaryData.likes || [] },
                });
              }
            });

            const unsubscribeComments = listenToComments(diary.id, (updatedComments) => {
              dispatch({ type: "SET_DIARY_COMMENTS", payload: { [diary.id]: updatedComments } });
            });

            return () => {
              unsubscribeComments();
              unsubscribeLikes();
            };
          });
        } catch (err) {
          console.error("獲取好友日記出錯:", err);
          dispatch({ type: "SET_ERROR", payload: "獲取好友日記出錯，請稍後再試。" });
        } finally {
          dispatch({ type: "SET_LOADING_DIARIES", payload: false });
        }
      };

      fetchSelectedFriendDiaries();
    } else {
      dispatch({ type: "SET_SELECTED_FRIEND_DIARIES", payload: [] });
    }
  }, [state.community.selectedFriend, userId]);

  const handleSelectFriend = async (friend) => {
    try {
      const friendUserData = await fetchUserData(friend.userId);

      dispatch({ type: "SET_SELECTED_FRIEND", payload: { ...friend, ...friendUserData } });
    } catch (err) {
      console.error("獲取數據時出錯：", err);
      dispatch({ type: "SET_ERROR", payload: "獲取好友資料時出錯，請稍後再試。" });
    }
  };

  const handleAcceptFriendRequest = async (request) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      dispatch({ type: "SET_ALERT", payload: { message: "用戶未登錄" } });
      return;
    }

    try {
      await acceptFriendRequest(request.userId, currentUser.uid);
      await deleteFriendRequest(currentUser.uid, request.id);

      dispatch({ type: "SET_ALERT", payload: { message: "雙方已成為好友" } });

      const updatedFriends = await fetchFriends(currentUser.uid);
      dispatch({ type: "SET_FRIENDS", payload: updatedFriends });

      dispatch({
        type: "SET_FRIEND_REQUESTS",
        payload: state.community.friendRequests.filter((req) => req.id !== request.id),
      });
    } catch (error) {
      console.error("接受好友邀請時錯誤：", error);
      dispatch({ type: "SET_ERROR", payload: "接受好友邀請時錯誤，請稍後再試。" });
    }
  };

  const handleDeleteFriend = (friendId) => {
    dispatch({
      type: "SET_CONFIRM_DIALOG",
      payload: {
        show: true,
        message: "確定要刪除這位好友嗎？",
        action: async () => {
          try {
            await deleteFriend(userId, friendId);
            dispatch({ type: "SET_ALERT", payload: { message: "好友已刪除" } });

            const updatedFriends = state.community.friends.filter(
              (friend) => friend.id !== friendId
            );
            dispatch({ type: "SET_FRIENDS", payload: updatedFriends });

            if (state.community.selectedFriend?.id === friendId) {
              dispatch({ type: "SET_SELECTED_FRIEND", payload: null });
            }
          } catch (error) {
            console.error("刪除好友時發生錯誤:", error);
            dispatch({
              type: "SET_ALERT",
              payload: { message: "刪除好友時發生錯誤，請稍後再試。" },
            });
          } finally {
            dispatch({
              type: "SET_CONFIRM_DIALOG",
              payload: { show: false, message: "", action: null },
            });
          }
        },
      },
    });
  };

  const handleRejectFriendRequest = (requestId) => {
    dispatch({
      type: "SET_CONFIRM_DIALOG",
      payload: {
        show: true,
        message: "確定要拒絕這個好友邀請嗎？",
        action: async () => {
          try {
            await deleteFriendRequest(userId, requestId);
            dispatch({ type: "SET_ALERT", payload: { message: "好友邀請已刪除！" } });
          } catch (err) {
            console.error("刪除好友邀請失敗：", err);
            dispatch({ type: "SET_ERROR", payload: "刪除好友邀請失敗，請稍後再試。" });
          } finally {
            dispatch({
              type: "SET_CONFIRM_DIALOG",
              payload: { show: false, message: "", action: null },
            });
          }
        },
      },
    });
  };

  const handleToggleCommentInput = (diaryId) => {
    dispatch({ type: "TOGGLE_COMMENT_INPUT", payload: diaryId });
  };

  const handleToggleLike = async (diaryId) => {
    try {
      const currentLikes = state.community.likeStatuses[diaryId] || [];
      await toggleLikeDiary(diaryId, currentLikes);

      const updatedLikes = currentLikes.includes(auth.currentUser.uid)
        ? currentLikes.filter((id) => id !== auth.currentUser.uid)
        : [...currentLikes, auth.currentUser.uid];
      dispatch({ type: "UPDATE_LIKE_STATUS", payload: { diaryId, likes: updatedLikes } });
    } catch (error) {
      console.error("更新按讚狀態時出錯:", error);
    }
  };

  const toggleFriendsList = () => {
    dispatch({ type: "TOGGLE_FRIENDS_LIST" });
  };

  return (
    <div className="min-h-screen flex flex-row-reverse">
      {state.common.alertMessage && (
        <Alert
          message={state.common.alertMessage}
          onClose={() => dispatch({ type: "CLEAR_ALERT" })}
          onConfirm={state.common.alertConfirm}
        />
      )}
      {state.common.showConfirmDialog && (
        <Confirm
          message={state.common.confirmMessage}
          onConfirm={state.common.confirmAction}
          onCancel={() =>
            dispatch({
              type: "SET_CONFIRM_DIALOG",
              payload: { show: false, message: "", action: null },
            })
          }
        />
      )}

      <div
        className={`fixed  right-0 h-screen bg-light-green transition-transform duration-300 ${
          state.community.isFriendsListOpen ? "translate-x-full" : "translate-x-0"
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
            {state.community.friends &&
              state.community.friends.length > 0 &&
              state.community.friends.map((friend) => (
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
        <div className="mb-6">
          <Sidebar
            isMenuOpen={state.common.isMenuOpen}
            setIsMenuOpen={() => dispatch({ type: "TOGGLE_MENU" })}
          />
          <div className="p-8">
            <div className="flex items-center space-x-3 justify-between">
              <TiThMenu
                className="w-6 h-6 lg:h-8 lg:w-8 mr-4 cursor-pointer text-gray-600 hover:text-gray-800"
                onClick={() => dispatch({ type: "TOGGLE_MENU" })}
              />
              <h2 className="text-lg lg:text-2xl ml-4 text-left flex-1">好友邀請</h2>
              <button className="text-2xl flex items-center" onClick={toggleFriendsList}>
                <IoIosArrowBack className="text-dark-green" />
                <RiUser5Fill className=" w-8 h-8 text-dark-green text-center items-center" />
              </button>
            </div>
            <ul className="mt-4">
              {state.community.friendRequests && state.community.friendRequests.length > 0 ? (
                state.community.friendRequests.map((request) => (
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
                        className="ml-2 md:ml-4 p-1 text-xs lg:text-base bg-dark-orange hover:bg-amber-500 text-white rounded "
                      >
                        接受
                      </button>
                      <button
                        onClick={() => handleRejectFriendRequest(request.id)}
                        className="text-white rounded items-center"
                      >
                        <IoCloseCircle className="w-7 h-7 text-pink-orange hover:text-red-400 ml-4" />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-sm lg:text-base mt-6 lg:text-xl">暫無好友邀請～</p>
              )}
            </ul>

            {state.community.selectedFriend ? (
              <div>
                <h2 className="text-lg lg:text-xl mb-4 mt-10">
                  {state.community.selectedFriend.name} 的日記動態
                </h2>
                {state.community.loadingDiaries ? (
                  <p>正在載入日記...</p>
                ) : state.error ? (
                  <p className="text-red-500">{state.error}</p>
                ) : state.community.selectedFriendDiaries.length > 0 ? (
                  <ul>
                    {state.community.selectedFriendDiaries.map((diary) => (
                      <li key={diary.id} className="mb-2 p-4 bg-light-beige rounded">
                        <div className="flex items-center mb-2">
                          {state.community.selectedFriend.profile_pic ? (
                            <img
                              src={state.community.selectedFriend.profile_pic}
                              alt={`${state.community.selectedFriend.name} profile pic`}
                              className="w-12 h-12 rounded-full mr-2"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-light-beige mr-2"></div>
                          )}
                          <p>{state.community.selectedFriend.name}</p>
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
                            likes={state.community.likeStatuses?.[diary.id] || []}
                            userId={auth.currentUser?.uid}
                            toggleLike={handleToggleLike}
                          />

                          <button
                            className="text-black flex items-center"
                            onClick={() => handleToggleCommentInput(diary.id)}
                          >
                            <FaRegComment />
                            <span className="ml-2">
                              {state.community.diaryComments?.[diary.id]?.length || 0}
                            </span>
                          </button>
                        </div>

                        {state.community.showCommentInput[diary.id] && (
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

            {state.common.error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">{state.common.error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Community;
