import React from "react";
import logo from "../assets/images/logo-3.png";
import { FaSearch } from "react-icons/fa";
function Header() {
  return (
    <header className="w-screen h-[90px] bg-amber-100 py-4 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <img src={logo} className="h-14" />
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
