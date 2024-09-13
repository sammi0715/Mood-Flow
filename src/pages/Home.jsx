import React from "react";
import background from "../assets/images/mood-flow-banner.png";
function Home() {
  return (
    <div className="relative w-full h-screen bg-mood-flow-banner bg-cover bg-center">
      <div className="absolute bottom-16 w-full flex flex-col justify-center items-center">
        <button className="w-48 h-16 bg-orange-200">登錄</button>
        <button className="w-48 h-16 bg-amber-200 mt-9">註冊</button>
      </div>
    </div>
  );
}
export default Home;
