import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaCircleUser } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { signUpUser, loginUser, signInWithGoogle } from "../utills/auth";
import { FcGoogle } from "react-icons/fc";
function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [selectedImageURL, setSelectedImageURL] = useState(null);
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
      const user = await signInWithGoogle();
      alert("Google 登入成功！");
      navigate(`/diary-calendar/${user.uid}`);
    } catch (error) {
      alert("Google 登入失敗: " + error.message);
    }
  };

  return (
    <div className="relative w-full h-screen bg-mood-flow-banner bg-cover bg-center">
      <div className="absolute bottom-16 w-full flex flex-col justify-center items-center">
        <button onClick={handleLoginClick} className="w-48 h-16 bg-orange-200">
          登入
        </button>
        <div className="flex flex-col items-center justify-center mt-4">
          <p className="text-sm text-center text-gray-700">或使用以下</p>
          <FcGoogle className="h-8 w-8 mt-2 cursor-pointer" onClick={handleGoogleSignIn} />
        </div>
        <button onClick={handleSignUpClick} className="w-48 h-16 bg-amber-200 mt-9">
          註冊
        </button>
      </div>
      {/* 登入視窗 */}
      {showLogin && (
        <div className="bg-gray-200 bg-opacity-50 fixed inset-0 flex justify-center items-center">
          <div className="bg-white p-8 rounded shadow-lg w-96">
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
              <button type="submit" className="w-full bg-gray-300 py-2">
                登入
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 註冊視窗 */}
      {showSignUp && (
        <div className="bg-gray-200 bg-opacity-50 fixed inset-0 flex justify-center items-center">
          <div className="bg-white p-8 rounded shadow-lg w-96">
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
                  className="h-16 w-16 rounded-full object-cover cursor-pointer"
                  onClick={handleImageUploadClick}
                />
              ) : (
                <FaCircleUser
                  className="h-16 w-16 cursor-pointer"
                  onClick={handleImageUploadClick}
                />
              )}
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
                <label>姓名</label>
                <input
                  type="text"
                  {...signUpRegister("name", { required: "請輸入姓名" })}
                  placeholder="姓名"
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
              <button type="submit" className="w-full bg-gray-300 py-2">
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
