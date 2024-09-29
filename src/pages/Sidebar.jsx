import React, { useState, useEffect } from "react";
import { FaUser, FaHistory } from "react-icons/fa";
import { TiChartBar } from "react-icons/ti";
import { IoClose } from "react-icons/io5";
import { IoIosSettings } from "react-icons/io";
import { fetchUserData } from "../utills/firebase-data";
import { useParams, Link, useNavigate } from "react-router-dom";
import { BiLogOutCircle } from "react-icons/bi";
import { signOut } from "firebase/auth";
import { auth } from "../utills/firebase";

function Sidebar({ isMenuOpen, setIsMenuOpen }) {
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const userId = localStorage.getItem("user_uid");
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user_uid");

      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error("登出失敗:", error);
    }
  };

  return (
    <div
      className={`absolute z-10 left-0 w-40 lg:w-64 h-screen bg-stone-50 p-4 lg:p-6 pl-4 lg:pl-10 transform transition-transform duration-300 overflow-y-hidden ${
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* 右上角的 X 按鈕 */}
      <div className="absolute top-1 right-2 cursor-pointer">
        <IoClose className="w-[20px] h-[20px] lg:w-6 lg:h-6" onClick={() => setIsMenuOpen(false)} />
      </div>

      {/* 使用者頭像和名稱 */}
      <div className="flex items-center mb-4 lg:mb-6">
        <img
          src={profileImage || "https://via.placeholder.com/50"}
          alt="profile"
          className="w-8 h-8 lg:w-12 lg:h-12 rounded-full mr-2 lg:mr-4"
        />
        <div>
          <h1 className="font-bold text-sm">{userName || "Username"}</h1>
        </div>
      </div>

      {/* 側邊選單的項目 */}
      <ul>
        <li className="mb-4 flex items-center">
          <FaUser className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
          <Link to={`/community/${userId}`} className="text-sm lg:text-lg">
            社群
          </Link>
        </li>
        <li className="mb-4 flex items-center">
          <TiChartBar className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
          <Link to={`/mood-track/${userId}`} className="text-sm lg:text-lg">
            心情統計
          </Link>
        </li>
        <li className="mb-4 flex items-center">
          <FaHistory className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
          <Link to={`/history-review/${userId}`} className="text-sm lg:text-lg">
            歷史回顧
          </Link>
        </li>
        <li className="mb-4 flex items-center">
          <IoIosSettings className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
          <Link to={`/settings/${userId}`} className="text-sm lg:text-lg">
            設定
          </Link>
        </li>
      </ul>

      {/* 登出按鈕 */}
      <div className="absolute bottom-36 left-6 align-center">
        <button
          onClick={handleLogout}
          className="text-sm lg:text-base text-black lg:px-4 py-2 rounded-md hover:bg-gray-200 transition flex items-center "
        >
          <BiLogOutCircle className="mr-2" />
          登出
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
