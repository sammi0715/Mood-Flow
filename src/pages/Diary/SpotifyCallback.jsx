import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSpotifyPlayer } from "../../utills/SpotifyPlayerContext";

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

  return <div>正在處理 Spotify 授權，請稍候...</div>;
}

export default SpotifyCallback;
