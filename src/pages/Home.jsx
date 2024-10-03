import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaCircleUser, FaCirclePlus } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { signUpUser, loginUser, signInWithGoogle, handleSetUsername } from "../utills/auth";
import { FcGoogle } from "react-icons/fc";
function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [selectedImageURL, setSelectedImageURL] = useState(null);
  const [showSetUsername, setShowSetUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const {
    register: signUpRegister,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors },
  } = useForm();

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm();

  const handleLoginClick = () => {
    setShowLogin(true);
    setShowSignUp(false);
  };
  const handleSignUpClick = () => {
    setShowLogin(false);
    setShowSignUp(true);
  };
  const closeModal = () => {
    setShowLogin(false);
    setShowSignUp(false);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageURL(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUploadClick = () => {
    document.getElementById("fileInput").click();
  };

  const onSignUp = async (data) => {
    const { name, email, password } = data;
    try {
      const user = await signUpUser(name, email, password, selectedImageURL);
      alert("註冊成功！");
      navigate(`/diary-calendar/${user.uid}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const onLogin = async (data) => {
    const { email, password } = data;
    try {
      const user = await loginUser(email, password);
      alert("登入成功！");
      navigate(`/diary-calendar/${user.uid}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      const { user, needsUsername } = result;

      if (needsUsername) {
        // 顯示設定帳號名稱的介面
        setShowSetUsername(true);
      } else {
        alert("Google 登入成功！");
        navigate(`/diary-calendar/${user.uid}`);
      }
    } catch (error) {
      alert("Google 登入失敗: " + error.message);
    }
  };

  const handleUsernameSubmit = async () => {
    try {
      await handleSetUsername(username);
      alert("帳號名稱設定成功！");
      setShowSetUsername(false);
      navigate(`/diary-calendar/${auth.currentUser.uid}`);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="relative w-full h-screen lg:bg-mood-flow-banner xl:bg-mood-flow-banner bg-mobile-mood-flow-banner bg-cover bg-center bg-no-repeat xl:bg-120-100 lg:bg-130-100 md:bg-100-130">
      <div className="absolute bottom-48 md:bottom-72 lg:bottom-56 w-full flex flex-col justify-center items-center">
        <button
          onClick={handleLoginClick}
          className="w-32 h-12 lg:w-48 lg:h-16 xl:w-48 xl:h-16 bg-orange-200"
        >
          登入
        </button>

        <button
          onClick={handleSignUpClick}
          className="w-32 h-12 lg:w-48 lg:h-16 xl:w-48 xl:h-16 bg-amber-200 mt-4 xl:mt-9"
        >
          註冊
        </button>
        <div className="flex flex-col items-center justify-center mt-4">
          <p className="text-sm text-center text-gray-700 relative before:block before:absolute before:left-[-50px] before:top-[50%] before:w-[40px] before:border-t before:border-gray-300 after:block after:absolute after:right-[-50px] after:top-[50%] after:w-[40px] after:border-t after:border-gray-300">
            或使用以下進行
          </p>

          <FcGoogle
            className="h-6 w-6  xl:h-8 xl:w-8 mt-2 cursor-pointer"
            onClick={handleGoogleSignIn}
          />
        </div>
      </div>
      {/* 登入視窗 */}
      {showLogin && (
        <div className="bg-gray-200 bg-opacity-50 fixed inset-0 flex justify-center items-center">
          <div className="bg-white p-8 rounded shadow-lg w-80 lg:w-96">
            <div className="flex justify-between">
              <h2 className="text-2xl mb-3">登入</h2>
              <IoClose onClick={closeModal} className="h-8 w-8" />
            </div>
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
              <div>
                <label>電子信箱</label>
                <input
                  type="email"
                  {...loginRegister("email", { required: "請輸入電子信箱" })}
                  placeholder="電子信箱"
                  className="border border-gray-300 p-2 w-full rounded"
                />
                {loginErrors.email && <p className="text-red-500">{loginErrors.email.message}</p>}
              </div>
              <div>
                <label>密碼</label>
                <input
                  type="password"
                  {...loginRegister("password", { required: "請輸入密碼" })}
                  placeholder="密碼"
                  className="border border-gray-300 p-2 w-full rounded"
                />
                {loginErrors.password && (
                  <p className="text-red-500">{loginErrors.password.message}</p>
                )}
              </div>
              <button type="submit" className="w-full bg-amber-200 py-2">
                登入
              </button>
            </form>
          </div>
        </div>
      )}
      {/* 帳號名稱設定彈窗 */}
      {showSetUsername && (
        <div className="bg-gray-200 bg-opacity-50 fixed inset-0 flex justify-center items-center">
          <div className="bg-white p-8 rounded shadow-lg w-96">
            <div className="flex justify-between">
              <h2 className="text-2xl mb-3">設定帳號名稱</h2>
              <IoClose onClick={() => setShowSetUsername(false)} className="h-8 w-8" />
            </div>
            <div className="space-y-4">
              <div>
                <label>帳號名稱</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="請輸入帳號名稱"
                  className="border border-gray-300 p-2 w-full rounded"
                />
                {error && <p className="text-red-500">{error}</p>}
              </div>
              <button onClick={handleUsernameSubmit} className="w-full bg-gray-300 py-2">
                確認
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 註冊視窗 */}
      {showSignUp && (
        <div className="bg-gray-200 bg-opacity-50 fixed inset-0 flex justify-center items-center">
          <div className="bg-white p-8 rounded shadow-lg  w-80 lg:w-96">
            <div className="flex justify-between">
              <h2 className="text-2xl mb-3">註冊</h2>
              <IoClose onClick={closeModal} className="h-8 w-8" />
            </div>
            {/* 頭像上傳區域 */}
            <div className="flex justify-center items-center mb-4">
              {selectedImageURL ? (
                <img
                  src={selectedImageURL}
                  alt="頭像預覽"
                  className="h-20 w-20 rounded-full object-cover cursor-pointer"
                  onClick={handleImageUploadClick}
                />
              ) : (
                <FaCircleUser
                  className="h-20 w-20 cursor-pointer text-gray-400"
                  onClick={handleImageUploadClick}
                />
              )}
              <FaCirclePlus className="w-6 h-6 border border-2 border-white text-gray-400 bg-white rounded-full top-[15px] left-[-10px] relative" />
            </div>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />

            <form onSubmit={handleSignUpSubmit(onSignUp)} className="space-y-4">
              <div>
                <label>帳號</label>
                <input
                  type="text"
                  {...signUpRegister("name", {
                    required: "請設定帳號",
                    pattern: {
                      value: /^[a-zA-Z0-9]{4,15}$/,
                      message: "帳號名稱必須是 4-15 個字元的英文字母或數字",
                    },
                  })}
                  placeholder="帳號"
                  className="border border-gray-300 p-2 w-full rounded"
                />
                {signUpErrors.name && <p className="text-red-500">{signUpErrors.name.message}</p>}
              </div>
              <div>
                <label>電子信箱</label>
                <input
                  type="email"
                  {...signUpRegister("email", { required: "請輸入電子信箱" })}
                  placeholder="電子信箱"
                  className="border border-gray-300 p-2 w-full rounded"
                />
                {signUpErrors.email && <p className="text-red-500">{signUpErrors.email.message}</p>}
              </div>
              <div>
                <label>密碼</label>
                <input
                  type="password"
                  {...signUpRegister("password", {
                    required: "請輸入密碼",
                    minLength: { value: 6, message: "密碼至少需6個字元" },
                  })}
                  placeholder="密碼"
                  className="border border-gray-300 p-2 w-full rounded"
                />
                {signUpErrors.password && (
                  <p className="text-red-500">{signUpErrors.password.message}</p>
                )}
              </div>
              <button type="submit" className="w-full bg-orange-200 py-2">
                註冊
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Home;
