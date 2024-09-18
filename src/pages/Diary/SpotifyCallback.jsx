import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const authorizationCode = query.get("code");
    const codeVerifier = localStorage.getItem("code_verifier");
    const userId = localStorage.getItem("user_uid");

    if (authorizationCode && codeVerifier) {
      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      const redirectUri = "https://mood-flow.web.app/spotify-callback";

      const params = new URLSearchParams();
      params.append("client_id", clientId);
      params.append("grant_type", "authorization_code");
      params.append("code", authorizationCode);
      params.append("redirect_uri", redirectUri);
      params.append("code_verifier", codeVerifier);

      fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            console.error(
              `Token exchange failed: ${response.status} ${response.statusText}`,
              errorData
            );
            throw new Error(
              `Token exchange failed: ${errorData.error} - ${errorData.error_description}`
            );
          }
          return response.json();
        })
        .then((data) => {
          if (data.access_token) {
            localStorage.setItem("spotify_token", data.access_token);

            if (data.refresh_token) {
              localStorage.setItem("spotify_refresh_token", data.refresh_token);
            }

            navigate(`/diary-calendar/${userId}`);
          } else {
            console.error("Failed to obtain access token:", data);
          }
        })
        .catch((error) => {
          console.error("Error exchanging code for token:", error);
        });
    }
  }, [navigate]);

  return <div>正在處理 Spotify 授權，請稍候...</div>;
}

export default SpotifyCallback;
