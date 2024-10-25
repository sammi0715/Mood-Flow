import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { BiLogOutCircle } from "react-icons/bi";
import { FaHistory, FaUser } from "react-icons/fa";
import { FaCircleUser } from "react-icons/fa6";
import { IoIosSettings } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { TiChartBar } from "react-icons/ti";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../utils/firebase";
import { fetchUserData } from "../utils/firebase-data";

function Sidebar({ isMenuOpen, setIsMenuOpen }) {
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_uid") || auth.currentUser?.uid;

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        console.error("無法獲取 userId，請先登入");
        navigate("/");
        return;
      }
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
      localStorage.removeItem("spotify_device_id");
      localStorage.removeItem("spotify_token");
      localStorage.removeItem("spotify_refresh_token");
      localStorage.removeItem("code_verifier");
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
        <div className="absolute top-1 right-2 cursor-pointer">
          <IoClose
            className="w-[20px] h-[20px] lg:w-6 lg:h-6"
            onClick={() => setIsMenuOpen(false)}
          />
        </div>

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
            <h1 className="text-sm xl:text-xl">{userName || "Username"}</h1>
          </div>
        </div>

        <ul>
          <Link to={`/community/${userId}`} className="text-sm lg:text-lg">
            <li className="mb-4 flex items-center hover:bg-light-yellow p-2 rounded-md cursor-pointer">
              <FaUser className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
              社群
            </li>
          </Link>
          <Link to={`/mood-track/${userId}`} className="text-sm lg:text-lg">
            <li className="mb-4 flex items-center hover:bg-light-yellow p-2 rounded-md cursor-pointer">
              <TiChartBar className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
              心情統計
            </li>
          </Link>
          <Link to={`/history-review/${userId}`} className="text-sm lg:text-lg">
            <li className="mb-4 flex items-center hover:bg-light-yellow p-2 rounded-md cursor-pointer">
              <FaHistory className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
              歷史回顧
            </li>
          </Link>
          <Link to={`/settings/${userId}`} className="text-sm lg:text-lg">
            <li className="mb-4 flex items-center hover:bg-light-yellow p-2 rounded-md cursor-pointer">
              <IoIosSettings className="mr-2 w-4 h-4 lg:w-6 lg:h-6" />
              設定
            </li>
          </Link>
        </ul>

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
