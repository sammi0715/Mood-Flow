import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSpotifyPlayer } from "../../utills/SpotifyPlayerContext";
import { FaSpotify } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
function SpotifyCallback() {
  const navigate = useNavigate();
  const { exchangeToken } = useSpotifyPlayer();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const authorizationCode = query.get("code");
    const userId = localStorage.getItem("user_uid");

    if (authorizationCode) {
      exchangeToken(authorizationCode)
        .then(() => {
          navigate(`/diary-calendar/${userId}`);
        })
        .catch((error) => {
          console.error("Error exchanging code for token:", error);
        });
    } else {
      console.error("No authorization code found in URL");
    }
  }, [navigate, exchangeToken]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen text-green-500 ">
      <FaSpotify className="text-7xl mb-4" />
      <p className="text-xl font-semibold">正在處理 Spotify 授權，請稍候...</p>

      <div className="mt-4">
        <FiLoader className="w-16 h-16 animate-spin animate-spin-slow" />
      </div>
    </div>
  );
}

export default SpotifyCallback;
