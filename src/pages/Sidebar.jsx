import React, { useState, useEffect } from "react";
import { FaUser, FaHistory } from "react-icons/fa";
import { TiChartBar } from "react-icons/ti";
import { IoClose } from "react-icons/io5";
import { IoIosSettings } from "react-icons/io";
import { fetchUserData } from "../utills/firebase-data";
import { useParams, Link } from "react-router-dom";

function Sidebar({ isMenuOpen, setIsMenuOpen }) {
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const userId = localStorage.getItem("user_uid");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await fetchUserData(userId);
        if (userData) {
          setUserName(userData.name);
          setProfileImage(userData.profile_pic);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, [userId]);
  return (
    <div
      className={`fixed z-10 left-0 w-64 h-screen bg-gray-100 p-6 pl-10 transform transition-transform duration-300 ${
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* 右上角的 X 按鈕 */}
      <div className="absolute top-4 right-4 cursor-pointer">
        <IoClose size={24} onClick={() => setIsMenuOpen(false)} />
      </div>

      {/* 使用者頭像和名稱 */}
      <div className="flex items-center mb-6">
        <img
          src={profileImage || "https://via.placeholder.com/50"}
          alt="profile"
          className="w-12 h-12 rounded-full mr-4"
        />
        <div>
          <h1 className="font-bold">{userName || "Username"}</h1>
        </div>
      </div>

      {/* 側邊選單的項目 */}
      <ul>
        <li className="mb-4 flex items-center">
          <FaUser className="mr-2 w-6 h-6" />
          <Link to="/community" className="text-lg">
            社群
          </Link>
        </li>
        <li className="mb-4 flex items-center">
          <TiChartBar className="mr-2 w-6 h-6" />
          <Link to="/mood-track" className="text-lg">
            心情統計
          </Link>
        </li>
        <li className="mb-4 flex items-center">
          <FaHistory className="mr-2 w-6 h-6" />
          <Link to={`/history-review/${userId}`} className="text-lg">
            歷史回顧
          </Link>
        </li>
        <li className="mb-4 flex items-center">
          <IoIosSettings className="mr-2 w-6 h-6" />
          <Link to="/settings" className="text-lg">
            設定
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
