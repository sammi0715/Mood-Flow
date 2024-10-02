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
import { FaCircleUser } from "react-icons/fa6";

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
    <>
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-20 top-[60px] lg:top-[90px]"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
      <div
        className={`fixed z-20 left-0 w-40 lg:w-64 h-screen bg-[#ffd3a5] p-4 lg:p-6 pl-4 lg:pl-10 transform transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 右上角的 X 按鈕 */}
        <div className="absolute top-1 right-2 cursor-pointer">
          <IoClose
            className="w-[20px] h-[20px] lg:w-6 lg:h-6"
            onClick={() => setIsMenuOpen(false)}
          />
        </div>

        {/* 使用者頭像和名稱 */}
        <div className="flex items-center mb-4 lg:mb-6">
          {profileImage ? (
            <img
              src={profileImage}
              alt="profile"
              className="w-8 h-8 lg:w-12 lg:h-12 rounded-full mr-2 lg:mr-4"
            />
          ) : (
            <FaCircleUser className="w-8 h-8 lg:w-12 lg:h-12 text-gray-800 rounded-full mr-2 lg:mr-4" />
          )}
          <div>
            <h1 className="font-bold  text-sm xl:text-xl">{userName || "Username"}</h1>
          </div>
        </div>

        {/* 側邊選單的項目 */}
        <ul>
          <li className="mb-4 flex items-center hover:bg-light-yellow p-2 rounded-md cursor-pointer">
            <FaUser className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
            <Link to={`/community/${userId}`} className="text-sm lg:text-lg">
              社群
            </Link>
          </li>
          <li className="mb-4 flex items-center hover:bg-light-yellow p-2 rounded-md cursor-pointer">
            <TiChartBar className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
            <Link to={`/mood-track/${userId}`} className="text-sm lg:text-lg">
              心情統計
            </Link>
          </li>
          <li className="mb-4 flex items-center hover:bg-light-yellow p-2 rounded-md cursor-pointer">
            <FaHistory className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
            <Link to={`/history-review/${userId}`} className="text-sm lg:text-lg">
              歷史回顧
            </Link>
          </li>
          <li className="mb-4 flex items-center hover:bg-light-yellow p-2 rounded-md cursor-pointer">
            <IoIosSettings className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
            <Link to={`/settings/${userId}`} className="text-sm lg:text-lg">
              設定
            </Link>
          </li>
        </ul>

        {/* 登出按鈕 */}
        <div className="absolute bottom-48 left-6 align-center cursor-pointer">
          <button
            onClick={handleLogout}
            className="text-sm lg:text-base text-black lg:px-4 py-2 rounded-md hover:bg-light-yellow transition flex items-center "
          >
            <BiLogOutCircle className="mr-2" />
            登出
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
