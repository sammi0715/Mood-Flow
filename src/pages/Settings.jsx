import React, { useState, useEffect } from "react";
import {
  fetchUserData,
  updateUserData,
  handleImageUpload as firebaseHandleImageUpload,
} from "../utills/firebase-data";
import { useParams } from "react-router-dom";
import { FaCircleUser } from "react-icons/fa6";
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
  const [previewImage, setPreviewImage] = useState(null);

  // 取得使用者資料
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

  // 處理圖片上傳
  const handleImageUpload = async (event) => {
    try {
      await firebaseHandleImageUpload(event, uploadedImages, setUploadedImages);
    } catch (error) {
      console.error("圖片上傳失敗：", error);
      alert("圖片上傳失敗，請稍後再試。");
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
    try {
      const updatedData = {
        name: newName,
        privacy_status: privacyStatus,
      };
      if (userData.profile_pic) {
        updatedData.profile_pic = userData.profile_pic;
      }
      await updateUserData(userId, updatedData);
      alert("個人資料更新成功！");
    } catch (error) {
      console.error("更新個人資料失敗：", error);
      alert("更新失敗，請稍後再試。");
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl mb-4">個人資料設定</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm mb-2">頭像</label>
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
      <div className="mb-4">
        <label className="block text-gray-700 text-sm mb-2">使用者名稱</label>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm mb-2">隱私狀態</label>
        <select
          value={privacyStatus}
          onChange={(e) => setPrivacyStatus(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="public">公開</option>
          <option value="private">私人</option>
        </select>
        <p className="text-gray-500 text-xs mt-1">
          <strong>公開：</strong>任何人都可以搜尋到您的帳戶並查看日記動態。
          <br />
          <strong>私人：</strong>只有您的好友可以查看日記動態。
        </p>
      </div>

      <button
        onClick={handleUpdateProfile}
        className="bg-dark-orange hover:bg-blue-400 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        更新資料
      </button>
    </div>
  );
};

export default ProfileSettings;
