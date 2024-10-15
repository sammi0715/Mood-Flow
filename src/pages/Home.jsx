import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FaCircleUser, FaCirclePlus } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { signUpUser, loginUser, signInWithGoogle, handleSetUsername } from "../utils/auth";
import { auth, db } from "../utils/firebase";
import Alert from "../components/alert";
import moodIcons from "../utils/moodIcons";
import logo from "../assets/images/logo-1.png";
import gsap from "gsap";
import { doc, getDoc } from "firebase/firestore";

function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [selectedImageURL, setSelectedImageURL] = useState(null);
  const [showSetUsername, setShowSetUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertConfirm, setAlertConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.utils.toArray(".emoji").forEach((emoji) => {
      gsap.to(emoji, {
        x: () => gsap.utils.random(-50, 50),
        y: () => gsap.utils.random(-30, 30),
        duration: gsap.utils.random(3, 5),
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
      });
    });
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        getDoc(userDocRef).then((userSnapshot) => {
          const userData = userSnapshot.data();

          if (!userData || !userData.name) {
            setShowSetUsername(true);
          } else {
            navigate(`/diary-calendar/${user.uid}`);
          }
        });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

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
      setAlertMessage("註冊成功！");
      setTimeout(() => {
        navigate(`/diary-calendar/${user.uid}`);
      }, 2000);
    } catch (error) {
      setAlertMessage(error.message);
    }
  };

  const onLogin = async (data) => {
    const { email, password } = data;

    try {
      const user = await loginUser(email, password);
      setAlertMessage("登入成功！");
      setTimeout(() => {
        navigate(`/diary-calendar/${user.uid}`);
      }, 2000);
    } catch (error) {
      setAlertMessage(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      const { user, needsUsername } = result;

      if (needsUsername) {
        setShowSetUsername(true);
      } else {
        setAlertMessage("Google 登入成功！");

        setTimeout(() => {
          navigate(`/diary-calendar/${user.uid}`);
        }, 2000);
      }
    } catch (error) {
      setAlertMessage("Google 登入失敗: " + error.message);
    }
  };

  const handleUsernameSubmit = async () => {
    try {
      await handleSetUsername(username);
      setAlertMessage("帳號名稱設定成功！");
      setShowSetUsername(false);
      navigate(`/diary-calendar/${auth.currentUser.uid}`);
    } catch (error) {
      setAlertMessage(error.message);
    }
  };

  return (
    <div className="relative w-full h-screen bg-cover bg-center bg-no-repeat  ">
      <div className=" bg-back h-full">
        <div className="flex justify-center">
          <img src={logo} className="w-8/12 h-8/12 md:w-2/4 md:h-2/4 pt-36 lg:pt-20 md:pt-32" />
        </div>

        {alertMessage && (
          <Alert
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
            onConfirm={alertConfirm}
          />
        )}
        <img
          src={moodIcons.開心}
          alt="開心"
          className="emoji absolute w-48 h-48 -left-24 -top-8 md:-left-40 md:w-64 md:h-64 lg:w-80 lg:h-80 transform scale-x-[-1]"
        />
        <img
          src={moodIcons.哭泣}
          alt="哭泣"
          className="emoji absolute top-72 md:top-[35%] w-32 h-32 -left-12 md:-left-16 md:w-48 md:h-48 transform scale-x-[-1]"
        />
        <img
          src={moodIcons.快樂}
          alt="快樂"
          className="emoji absolute w-32 h-32 right-6 top-[27%] md:right-12 md:w-52 md:h-52 lg:w-80 lg:h-80 -rotate-12"
        />
        <img
          src={moodIcons.興奮}
          alt="興奮"
          className="emoji absolute w-40 h-40 bottom-20 md:bottom-[15%%] -left-4 md:left-5 md:w-64 md:h-64 lg:w-72 lg:h-72 lg:bottom-[5%] transform scale-x-[-1]"
        />
        <img
          src={moodIcons.生氣}
          alt="生氣"
          className="emoji absolute w-24 h-24 -top-2 right-12 md:w-36 md:h-36 lg:w-48 lg:h-48 rotate-12"
        />
        <img
          src={moodIcons.平靜}
          alt="平靜"
          className="emoji absolute w-32 h-32 bottom-20 md:bottom-16 right-4 md:w-52 md:h-52"
        />
        <div className="w-full flex flex-col justify-center items-center mt-24">
          <button
            onClick={handleLoginClick}
            className="w-32 h-12 lg:w-48 lg:h-16 xl:w-48 xl:h-16 bg-orange-200 pointer hover:bg-orange-300 rounded-sm text-base md:text-xl"
          >
            登入
          </button>
          <button
            onClick={handleSignUpClick}
            className="w-32 h-12 lg:w-48 lg:h-16 xl:w-48 xl:h-16 bg-amber-200 mt-4 xl:mt-9 pointer hover:bg-amber-300 rounded-sm text-base md:text-xl"
          >
            註冊
          </button>
          <div className="flex flex-col items-center justify-center mt-4">
            <p className="text-sm md:text-base text-center text-gray-700 relative before:block before:absolute before:left-[-50px] before:top-[50%] before:w-[40px] before:border-t before:border-gray-500 after:block after:absolute after:right-[-50px] after:top-[50%] after:w-[40px] after:border-t after:border-gray-500">
              或使用以下進行
            </p>

            <FcGoogle
              className="h-6 w-6  xl:h-8 xl:w-8 mt-2 cursor-pointer"
              onClick={handleGoogleSignIn}
            />
          </div>
        </div>
      </div>

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
              <button
                type="submit"
                className="w-full bg-amber-200 py-2 pointer hover:bg-amber-300 rounded-sm"
              >
                登入
              </button>
            </form>
          </div>
        </div>
      )}

      {showSetUsername && (
        <div className="bg-gray-200 bg-opacity-50 fixed inset-0 flex justify-center items-center">
          <div className="bg-white p-8 rounded shadow-lg w-96">
            <div className="flex justify-between">
              <h2 className="text-2xl mb-3">設定使用者名稱</h2>
              <IoClose onClick={() => setShowSetUsername(false)} className="h-8 w-8" />
            </div>
            <div className="space-y-4">
              <div>
                <label>使用者名稱</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="請輸入使用者名稱"
                  className="border border-gray-300 p-2 w-full rounded"
                />
                {error && <p className="text-red-500">{error}</p>}
              </div>
              <button
                onClick={handleUsernameSubmit}
                className="w-full bg-orange-200 py-2 pointer  hover:bg-orange-300 rounded-sm"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignUp && (
        <div className="bg-gray-200 bg-opacity-50 fixed inset-0 flex justify-center items-center">
          <div className="bg-white p-8 rounded shadow-lg  w-80 lg:w-96 min-h-[550px] ">
            <div className="flex justify-between">
              <h2 className="text-2xl mb-3">註冊</h2>
              <IoClose onClick={closeModal} className="h-8 w-8" />
            </div>

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

            <form onSubmit={handleSignUpSubmit(onSignUp)} className="space-y-6">
              <div>
                <label>使用者名稱</label>
                <input
                  type="text"
                  {...signUpRegister("name", {
                    required: "請設定使用者名稱",
                    pattern: {
                      value: /^[a-zA-Z0-9]{4,15}$/,
                      message: "使用者名稱必須是 4-15 個字元的英文字母或數字",
                    },
                  })}
                  placeholder="使用者名稱"
                  className="border border-gray-300 p-2 w-full rounded"
                />
                {signUpErrors.name && (
                  <p className="text-red-500 min-h-[20px]">{signUpErrors.name.message}</p>
                )}
              </div>
              <div>
                <label>電子信箱</label>
                <input
                  type="email"
                  {...signUpRegister("email", { required: "請輸入電子信箱" })}
                  placeholder="電子信箱"
                  className="border border-gray-300 p-2 w-full rounded"
                />
                {signUpErrors.email && (
                  <p className="text-red-500  min-h-[20px]">{signUpErrors.email.message}</p>
                )}
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
                  <p className="text-red-500  min-h-[20px]">{signUpErrors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-orange-200 py-2 pointer hover:bg-orange-300 rounded-sm"
              >
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
