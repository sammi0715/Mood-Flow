import React, { useState, useEffect, useRef } from "react";
import {
  addCommentAndNotify,
  addReplyAndNotify,
  listenToComments,
  listenToReplies,
  fetchUserData,
} from "../utills/firebase-data";
import { FaCircleUser } from "react-icons/fa6";
import Alert from "./alert";

function CommentSection({ diaryId, diaryOwnerId, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [commentTexts, setCommentTexts] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [userProfiles, setUserProfiles] = useState({});
  const [alertMessage, setAlertMessage] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const commentsToShow = 2;
  const repliesListeners = useRef({});
  const replyInputRef = useRef(null);
  useEffect(() => {
    const unsubscribeComments = listenToComments(diaryId, (fetchedComments) => {
      setComments(fetchedComments);

      // 確保每條留言的回覆正確監聽並更新
      fetchedComments.forEach((comment) => {
        if (!repliesListeners.current[comment.id]) {
          const unsubscribe = listenToReplies(diaryId, comment.id, (fetchedReplies) => {
            setComments((prevComments) =>
              prevComments.map((c) =>
                c.id === comment.id ? { ...c, replies: [...fetchedReplies] } : c
              )
            );
          });
          repliesListeners.current[comment.id] = unsubscribe;
        }
      });
    });

    return () => {
      unsubscribeComments();
      Object.values(repliesListeners.current).forEach((unsubscribe) => unsubscribe());
    };
  }, [diaryId]);

  useEffect(() => {
    comments.forEach(async (comment) => {
      if (!userProfiles[comment.userId]) {
        const userData = await fetchUserData(comment.userId);
        setUserProfiles((prev) => ({ ...prev, [comment.userId]: userData }));
      }

      comment.replies.forEach(async (reply) => {
        if (!userProfiles[reply.userId]) {
          const userData = await fetchUserData(reply.userId);
          setUserProfiles((prev) => ({ ...prev, [reply.userId]: userData }));
        }
      });
    });
  }, [comments]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (replyInputRef.current && !replyInputRef.current.contains(event.target)) {
        setReplyingTo(null);
      }
    };

    if (replyingTo !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [replyingTo]);

  useEffect(() => {
    if (replyingTo !== null && replyInputRef.current) {
      const input = replyInputRef.current.querySelector("input");
      if (input) {
        input.focus();
      }
    }
  }, [replyingTo]);

  const handleAddComment = async () => {
    if (!currentUserId) {
      setAlertMessage("請先登入才能留言");
      return;
    }

    if (!commentTexts.trim()) return;

    try {
      if (!diaryOwnerId) {
        throw new Error("日記擁有者未定義");
      }

      await addCommentAndNotify(diaryId, commentTexts, diaryOwnerId);
      setCommentTexts("");
    } catch (error) {
      console.error("添加留言時出錯:", error);
      setAlertMessage("添加留言時出錯，請稍後再試。");
    }
  };

  const handleAddReply = async (parentCommentId, replyToUserId) => {
    if (!replyContent.trim() || !replyToUserId) return;
    try {
      await addReplyAndNotify(diaryId, parentCommentId, replyContent, replyToUserId);
      setReplyContent("");
      setReplyingTo(null);
      console.log("回覆成功寫入！");
    } catch (error) {
      console.error("添加回覆時出錯:", error);
      setAlertMessage("添加回覆時出錯，請稍後再試。");
    }
  };

  const handleReplyClick = (commentId) => {
    setReplyingTo(commentId);
  };

  const toggleShowAllComments = () => {
    setShowAllComments((prev) => !prev);
  };

  return (
    <div className="comment-section">
      {alertMessage && (
        <Alert
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
          onConfirm={() => setAlertMessage(null)}
        />
      )}
      <ul className="space-y-4">
        {comments.slice(0, showAllComments ? comments.length : commentsToShow).map((comment) => (
          <li key={comment.id} className="mb-2 mt-4">
            <div className="flex items-start mb-1">
              {userProfiles[comment.userId]?.profile_pic ? (
                <img
                  src={userProfiles[comment.userId].profile_pic}
                  alt={`${userProfiles[comment.userId].name} profile`}
                  className="w-10 h-10 rounded-full mr-2"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <FaCircleUser className="text-gray-500" />
                </div>
              )}

              <div>
                <div className="p-2 bg-antique-white rounded-lg">
                  <p className="font-semibold text-base">
                    {userProfiles[comment.userId]?.name || "載入中..."}
                  </p>
                  <p className="text-sm mt-2">{comment.content}</p>
                </div>

                <div className="flex  items-center mt-2">
                  <button
                    onClick={() => handleReplyClick(comment.id)}
                    className="text-sm text-blue-500 mr-4"
                  >
                    回覆
                  </button>
                  <p className="text-xs text-gray-700">
                    {comment.createdAt?.toDate().toLocaleString()}
                  </p>
                </div>
                {comment.replies && comment.replies.length > 0 && (
                  <ul className="mt-4 ml-6">
                    {comment.replies.map((reply) => (
                      <li key={reply.id} className="mb-2">
                        <div className="flex items-start">
                          {userProfiles[reply.userId]?.profile_pic ? (
                            <img
                              src={userProfiles[reply.userId].profile_pic}
                              alt={`${userProfiles[reply.userId].name} profile`}
                              className="w-8 h-8 rounded-full mr-2"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full mr-2 bg-gray-200 flex items-center justify-center">
                              <FaCircleUser className="text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="bg-antique-white p-2 rounded-lg">
                              <p className="font-medium text-sm">
                                {userProfiles[reply.userId]?.name || "載入中..."}
                              </p>
                              <p className="text-sm">{reply.content}</p>
                            </div>
                            <p className="text-xs text-gray-700 mt-1">
                              {reply.createdAt?.toDate().toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {replyingTo === comment.id && (
                  <div className="mt-2" ref={replyInputRef}>
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`回覆 ${userProfiles[comment.userId]?.name || "使用者"}`}
                      className="border p-2 w-full rounded mb-2"
                    />
                    <button
                      onClick={() => handleAddReply(comment.id, comment.userId)}
                      className="px-2 bg-amber-500 text-white rounded"
                    >
                      送出
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {comments.length > commentsToShow && (
        <button onClick={toggleShowAllComments} className="text-dark-blue mt-2">
          {showAllComments ? "收起留言" : `顯示所有 ${comments.length} 則留言`}
        </button>
      )}

      <div className="add-comment mt-4">
        <input
          type="text"
          value={commentTexts}
          onChange={(e) => setCommentTexts(e.target.value)}
          placeholder="輸入留言..."
          className="border p-2 w-full rounded"
        />
        <button onClick={handleAddComment} className="mt-2 px-2 bg-amber-500 text-white rounded">
          送出
        </button>
      </div>
    </div>
  );
}

export default CommentSection;
