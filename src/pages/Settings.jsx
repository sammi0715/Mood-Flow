import React, { useEffect, useState } from "react";
import { FaCircleUser } from "react-icons/fa6";
import { useParams } from "react-router-dom";
import Alert from "../components/alert";
import {
  fetchUserData,
  handleImageUpload as firebaseHandleImageUpload,
  getFriendIds,
  updateFriendName,
  updateUserData,
} from "../utils/firebase-data";
const ProfileSettings = () => {
  const { userId } = useParams();

  const [userData, setUserData] = useState({
    name: "",
    profile_pic: "",
    privacy_status: "public",
  });
  const [newName, setNewName] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState("public");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertConfirm, setAlertConfirm] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const data = await fetchUserData(userId);
        if (data) {
          setUserData(data);
          setNewName(data.name || "");
          setPrivacyStatus(data.privacy_status || "public");
        }
      } catch (error) {
        console.error("取得使用者資料失敗：", error);
      }
    };
    getUserData();
  }, [userId]);

  const handleImageUpload = async (event) => {
    try {
      await firebaseHandleImageUpload(event, uploadedImages, setUploadedImages);
    } catch (error) {
      console.error("圖片上傳失敗：", error);
      setAlertMessage("圖片上傳失敗，請稍後再試。");
    }
  };

  useEffect(() => {
    if (uploadedImages.length > 0) {
      setUserData((prevData) => ({
        ...prevData,
        profile_pic: uploadedImages[0],
      }));
    }
  }, [uploadedImages]);

  const handleUpdateProfile = async () => {
    const usernamePattern = /^[a-zA-Z0-9]{4,15}$/;
    if (!usernamePattern.test(newName)) {
      setAlertMessage("使用者名稱必須是 4-15 個字元的英文字母或數字");
      return;
    }
    try {
      const updatedData = {
        name: newName,
        privacy_status: privacyStatus,
      };
      if (userData.profile_pic) {
        updatedData.profile_pic = userData.profile_pic;
      }
      await updateUserData(userId, updatedData);

      const friendIds = await getFriendIds(userId);

      for (const friendId of friendIds) {
        await updateFriendName(friendId, userId, newName);
      }

      setAlertMessage("個人資料更新成功！");
    } catch (error) {
      console.error("更新個人資料失敗：", error);
      setAlertMessage("更新失敗，請稍後再試。");
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl mb-4">個人資料設定</h2>
      <div className="mb-4 md:ml-8">
        <label className="block text-gray-700 text-sm md:text-lg mb-2">頭像</label>
        {uploadedImages.length > 0 ? (
          <img
            src={uploadedImages[0]}
            alt="Profile Preview"
            className="h-28 w-28  mt-2 rounded-full"
          />
        ) : userData.profile_pic ? (
          <img src={userData.profile_pic} alt="Profile" className="h-28 w-28 mt-2 rounded-full" />
        ) : (
          <div className="h-20 w-20 mt-2 bg-gray-200 flex items-center justify-center text-gray-500 rounded-full">
            <FaCircleUser className="h-20 w-20" />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="py-2 px-3 mt-4"
        />
      </div>
      <div className="mb-4  md:ml-8">
        <label className="block text-gray-700 text-sm md:text-lg mb-2">使用者名稱</label>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="shadow appearance-none border rounded w-[45%] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4  md:ml-8">
        <label className="block text-gray-700 text-sm md:text-lg mb-2">隱私狀態</label>
        <select
          value={privacyStatus}
          onChange={(e) => setPrivacyStatus(e.target.value)}
          className="shadow appearance-none border rounded w-[45%] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="public">公開</option>
          <option value="private">私人</option>
        </select>
        <p className="text-gray-500 text-xs md:text-sm mt-1">
          <strong>公開：</strong>任何人都可以搜尋到您的帳戶並查看日記動態。
          <br />
          <strong>私人：</strong>只有您的好友可以查看日記動態。
        </p>
      </div>

      <button
        onClick={handleUpdateProfile}
        className="bg-dark-orange hover:bg-blue-400 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline md:ml-8"
      >
        更新資料
      </button>
      {alertMessage && (
        <Alert
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
          onConfirm={alertConfirm}
        />
      )}
    </div>
  );
};

export default ProfileSettings;
