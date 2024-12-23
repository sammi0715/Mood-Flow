import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../components/alert";
const generateCodeVerifier = (length = 128) => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let verifier = "";
  for (let i = 0; i < length; i++) {
    verifier += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return verifier;
};

const base64UrlEncode = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64String = window.btoa(binary);
  return base64String.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const generateCodeChallenge = async (codeVerifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
};

const SpotifyPlayerContext = createContext();

export const SpotifyPlayerProvider = ({ children }) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem("spotify_device_id"));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(() => localStorage.getItem("spotify_token"));
  const [alertMessage, setAlertMessage] = useState(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const navigate = useNavigate();

  const initializePlayer = useCallback(() => {
    if (!spotifyToken) return;

    const newPlayer = new window.Spotify.Player({
      name: "Mood Flow Web Player",
      getOAuthToken: (cb) => {
        cb(spotifyToken);
      },
      volume: 0.4,
    });

    newPlayer.addListener("ready", ({ device_id }) => {
      localStorage.setItem("spotify_device_id", device_id);
      setDeviceId(device_id);
      setIsPlayerInitialized(true);
      setIsPlayerReady(true);
    });

    newPlayer.addListener("not_ready", ({ device_id }) => {
      setIsPlayerReady(false);
    });

    newPlayer.addListener("player_state_changed", (state) => {
      if (!state) {
        setIsPlaying(false);
        setCurrentTrack(null);
        return;
      }
      setIsPlaying(!state.paused);
      setCurrentTrack(state.track_window.current_track);
    });

    newPlayer.connect().then((success) => {
      if (success) {
      }
    });

    setPlayer(newPlayer);
  }, [spotifyToken]);

  const handleSpotifyLogin = useCallback(async () => {
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_device_id");

    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = "https://mood-flow.web.app/spotify-callback";

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    localStorage.setItem("code_verifier", codeVerifier);

    const scope = [
      "user-read-email",
      "user-read-private",
      "user-library-read",
      "playlist-read-private",
      "user-top-read",
      "user-modify-playback-state",
      "user-read-playback-state",
      "streaming",
    ].join(" ");

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.search = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    }).toString();

    window.location.href = authUrl.toString();
  }, []);

  const exchangeToken = useCallback(
    async (authorizationCode) => {
      const codeVerifier = localStorage.getItem("code_verifier");
      if (!codeVerifier) {
        console.error("code_verifier is missing from localStorage.");
        return;
      }

      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      const redirectUri = "https://mood-flow.web.app/spotify-callback";

      const params = new URLSearchParams({
        client_id: clientId,
        grant_type: "authorization_code",
        code: authorizationCode,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      });

      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        const data = await response.json();

        if (data.access_token) {
          localStorage.setItem("spotify_token", data.access_token);
          setSpotifyToken(data.access_token);

          if (data.refresh_token) {
            localStorage.setItem("spotify_refresh_token", data.refresh_token);
          }

          localStorage.removeItem("code_verifier");
          window.history.replaceState({}, document.title, window.location.pathname);
          initializePlayer();
        } else {
          console.error("Failed to obtain access token:", data);
        }
      } catch (error) {
        console.error("Error exchanging token:", error);
      }
    },
    [initializePlayer]
  );

  useEffect(() => {
    if (!spotifyToken) return;

    if (window.Spotify) {
      initializePlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = () => {
        initializePlayer();
      };
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      window.onSpotifyWebPlaybackSDKReady = null;
    };
  }, [spotifyToken]);

  const refreshToken = useCallback(async () => {
    const refresh_token = localStorage.getItem("spotify_refresh_token");
    if (!refresh_token) return false;

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(
            `${import.meta.env.VITE_SPOTIFY_CLIENT_ID}:${
              import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
            }`
          )}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refresh_token,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem("spotify_token", data.access_token);
        setSpotifyToken(data.access_token);
        return true;
      } else {
        console.error("Failed to refresh token:", data);
        if (data.error === "invalid_grant") {
          localStorage.removeItem("spotify_refresh_token");
          setAlertMessage("您的 Spotify 連線已過期，請重新登入。");
        }
        return false;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  }, []);

  const fetchWithTokenCheck = useCallback(
    async (url, options = {}) => {
      let token = spotifyToken;

      const makeRequest = async (authToken) => {
        return fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${authToken}`,
            ...options.headers,
          },
        });
      };

      let response = await makeRequest(token);

      if ([401, 403].includes(response.status)) {
        const refreshed = await refreshToken();
        if (refreshed) {
          token = localStorage.getItem("spotify_token");
          response = await makeRequest(token);
        } else {
          setSpotifyToken(null);
          setAlertMessage("您的 Spotify 連線已過期，請重新登入。");
          throw new Error("Spotify 連線已過期");
        }
      }

      return response;
    },
    [spotifyToken, refreshToken]
  );

  const handlePlayPause = useCallback(async () => {
    if (!player || !isPlayerReady) {
      console.error("播放器未初始化或未就緒");
      setAlertMessage("播放器未就緒，請稍後再試。");
      return;
    }

    try {
      await player.togglePlay();
    } catch (error) {
      console.error("播放/暫停音樂時發生錯誤：", error);
      setAlertMessage("播放控制出錯，請稍後再試。");
    }
  }, [player, isPlayerReady]);

  const handleTrackSelect = useCallback(
    async (trackUri) => {
      if (!isPlayerInitialized || !isPlayerReady || !deviceId) {
        console.error("播放器未初始化、未就緒或無效的 deviceId", {
          isPlayerInitialized,
          isPlayerReady,
          deviceId,
        });
        setAlertMessage("播放器未就緒，請稍後再試。");
        return;
      }

      try {
        const response = await fetchWithTokenCheck(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
            body: JSON.stringify({ uris: [trackUri] }),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setIsPlaying(true);
      } catch (error) {
        console.error("播放歌曲時發生錯誤", error);
        setAlertMessage("播放歌曲時發生錯誤，請稍後再試。");
      }
    },
    [isPlayerInitialized, isPlayerReady, deviceId, fetchWithTokenCheck]
  );

  const contextValue = {
    player,
    deviceId,
    isPlaying,
    setIsPlaying,
    currentTrack,
    setCurrentTrack,
    handlePlayPause,
    handleTrackSelect,
    spotifyToken,
    handleSpotifyLogin,
    refreshToken,
    exchangeToken,
    fetchWithTokenCheck,
    initializePlayer,
  };

  return (
    <SpotifyPlayerContext.Provider value={contextValue}>
      {children}
      {alertMessage && <Alert message={alertMessage} onClose={() => setAlertMessage(null)} />}
    </SpotifyPlayerContext.Provider>
  );
};

export const useSpotifyPlayer = () => {
  return useContext(SpotifyPlayerContext);
};
