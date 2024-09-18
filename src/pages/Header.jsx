import React, { useState, useEffect } from "react";
import logo from "../assets/images/logo-3.png";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth } from "../utills/firebase";
import { onAuthStateChanged } from "firebase/auth";

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogoClick = () => {
    if (user) {
      navigate(`/diary-calendar/${user.uid}`);
    } else {
      navigate("/");
    }
  };

  return (
    <header className="w-screen h-[90px] bg-amber-100 py-4 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <img src={logo} className="h-14 cursor-pointer" onClick={handleLogoClick} alt="Logo" />
      </div>
      <div>
        <button className="text-gray-600">
          <FaSearch className="h-8 w-8" />
        </button>
      </div>
    </header>
  );
}

export default Header;
