import React, { useState, useEffect } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../utils/firebase";

const LikeTooltip = ({ diaryId, likes, userId, toggleLike }) => {
  const [likeNames, setLikeNames] = useState([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);

  useEffect(() => {
    if (likes.length > 0) {
      const fetchLikeNames = async () => {
        setIsLoadingLikes(true);
        const names = await Promise.all(
          likes.map(async (likeId) => {
            const userDoc = await getDoc(doc(db, "users", likeId));
            return userDoc.exists() ? userDoc.data().name : "未知使用者";
          })
        );
        setLikeNames(names);
        setIsLoadingLikes(false);
      };

      fetchLikeNames();
    }
  }, [likes]);
  const tooltipId = `likesTooltip-${diaryId}`;

  return (
    <div className="likes  flex items-center">
      <button onClick={() => toggleLike(diaryId, likes)} className="flex items-center">
        {likes.includes(userId) ? (
          <FaHeart className="text-red-600" />
        ) : (
          <FaRegHeart className="text-gray-600" />
        )}
        <span className="ml-2" data-tooltip-id={tooltipId}>
          {likes.length}
        </span>
      </button>

      <Tooltip id={tooltipId} place="top" effect="solid" delayShow={200}>
        {isLoadingLikes ? (
          <span>加載中...</span>
        ) : likeNames.length > 0 ? (
          <div>
            {likeNames.map((name, index) => (
              <div key={index}>{name}</div>
            ))}
          </div>
        ) : (
          <span>沒有按讚記錄</span>
        )}
      </Tooltip>
    </div>
  );
};

export default LikeTooltip;
