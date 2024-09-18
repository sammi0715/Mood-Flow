import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

let spotifyPlayerInstance = null;

export const useSpotifyPlayer = () => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(localStorage.getItem("spotify_device_id") || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(localStorage.getItem("spotify_token") || null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("spotify_token");
    if (token) {
      initializePlayer(token);
    }
  }, []);

  const generateCodeVerifier = (length = 128) => {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let verifier = "";
    for (let i = 0; i < length; i++) {
      verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return verifier;
  };

  const generateCodeChallenge = async (codeVerifier) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return base64UrlEncode(digest);
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

  const handleSpotifyLogin = async () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = "https://mood-flow.web.app/spotify-callback";

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    localStorage.setItem("code_verifier", codeVerifier);

    const scope =
      "user-read-email user-read-private user-library-read playlist-read-private user-top-read user-modify-playback-state user-read-playback-state streaming";

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(
      scope
    )}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

    window.location.href = authUrl;
  };

  const exchangeToken = async (authorizationCode) => {
    const codeVerifier = localStorage.getItem("code_verifier");
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = "https://mood-flow.web.app/spotify-callback";

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", authorizationCode);
    params.append("redirect_uri", redirectUri);
    params.append("code_verifier", codeVerifier);

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("spotify_token", data.access_token);
      setSpotifyToken(data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("spotify_refresh_token", data.refresh_token);
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      initializePlayer(data.access_token);
    } else {
      console.error("Failed to obtain access token:", data);
    }
  };

  const initializePlayer = (token) => {
    const existingDeviceId = localStorage.getItem("spotify_device_id");

    if (window.Spotify && token) {
      if (!spotifyPlayerInstance) {
        spotifyPlayerInstance = new window.Spotify.Player({
          name: "My Web Player",
          getOAuthToken: (cb) => {
            cb(token);
          },
        });

        spotifyPlayerInstance.addListener("ready", ({ device_id }) => {
          console.log("Spotify Player is ready with Device ID", device_id);
          localStorage.setItem("spotify_device_id", device_id);
          setDeviceId(device_id);
        });

        spotifyPlayerInstance.addListener("not_ready", ({ device_id }) => {
          console.log("Device ID has gone offline", device_id);
        });

        spotifyPlayerInstance.connect();
        setPlayer(spotifyPlayerInstance);
      } else if (existingDeviceId) {
        setDeviceId(existingDeviceId);
        setPlayer(spotifyPlayerInstance);
      }
    }
  };

  const refreshToken = async () => {
    const refresh_token = localStorage.getItem("spotify_refresh_token");
    if (!refresh_token) return;

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(
          import.meta.env.VITE_SPOTIFY_CLIENT_ID + ":" + import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
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
      initializePlayer(data.access_token);
    }
  };

  const fetchWithTokenCheck = async (url, options) => {
    let token = localStorage.getItem("spotify_token");

    let response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    // 如果 token 過期或無效，刷新 token
    if (response.status === 401) {
      console.log("Token expired, refreshing token...");
      await refreshToken();
      token = localStorage.getItem("spotify_token");

      response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
    }

    return response;
  };

  const handlePlayPause = async () => {
    if (!player) {
      console.error("播放器未初始化");
      return;
    }

    try {
      if (isPlaying) {
        await player.pause();
        setIsPlaying(false);
      } else {
        await player.resume();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("播放/暫停音樂時發生錯誤：", error);
    }
  };

  const transferPlaybackToDevice = async (deviceId) => {
    const token = localStorage.getItem("spotify_token");

    try {
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });

      if (response.status !== 204) {
        console.error("Failed to transfer playback to the device", response.statusText);
      } else {
        console.log("Playback transferred to the device:", deviceId);
      }
    } catch (error) {
      console.error("Error transferring playback to device:", error);
    }
  };

  const handleTrackSelect = async (trackUri) => {
    if (!player || !deviceId) {
      console.error("播放器未初始化或無效的 deviceId");
      return;
    }

    try {
      await transferPlaybackToDevice(deviceId);

      const token = localStorage.getItem("spotify_token");

      const response = await fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [trackUri],
          device_id: deviceId,
        }),
      });

      if (response.status === 204) {
        setIsPlaying(true);
        setCurrentTrack(trackUri);
      } else {
        console.error("無法播放歌曲", response.statusText);
      }
    } catch (error) {
      console.error("播放歌曲時發生錯誤", error);
    }
  };

  return {
    player,
    deviceId,
    isPlaying,
    currentTrack,
    setCurrentTrack,
    handlePlayPause,
    handleTrackSelect,
    spotifyToken,
    handleSpotifyLogin,
    refreshToken,
    exchangeToken,
    fetchWithTokenCheck,
  };
};
