import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../utills/firebase";
import { TiThMenu } from "react-icons/ti";
import moodIcons from "../../utills/moodIcons";
import { IoPlayCircle, IoPauseCircle } from "react-icons/io5";

let spotifyPlayerInstance = null;

function ViewDiaryEntry() {
  const { diaryId } = useParams();
  const navigate = useNavigate();
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(localStorage.getItem("spotify_device_id") || null);
  const [currentTrack, setCurrentTrack] = useState(null);

  useEffect(() => {
    const fetchDiary = async () => {
      try {
        const diaryRef = doc(db, "diaries", diaryId);
        const diarySnap = await getDoc(diaryRef);
        if (diarySnap.exists()) {
          setDiary(diarySnap.data());
        } else {
          console.log("No such document!");
          alert("找不到該日記條目。");
          navigate("/diary-calendar");
        }
      } catch (error) {
        console.error("Error fetching diary: ", error);
        alert("加載日記時出錯，請稍後再試。");
      } finally {
        setLoading(false);
      }
    };

    if (diaryId) {
      fetchDiary();
    }
  }, [diaryId, navigate]);

  const setDeviceAsActive = async (device_id, token) => {
    const response = await fetch(`https://api.spotify.com/v1/me/player`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_ids: [device_id],
        play: false,
      }),
    });

    if (!response.ok) {
      console.error("無法設置 Web 播放器為活動設備", response.statusText);
    }
  };

  // 初始化 Spotify 播放 SDK
  useEffect(() => {
    const token = localStorage.getItem("spotify_token");
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
          setDeviceAsActive(device_id, token);
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
  }, []);

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
    }
  };

  const handleTrackSelect = async () => {
    if (!player || !deviceId || !diary.track) {
      console.error("播放器未初始化或track未定義");
      return;
    }

    if (isPlaying) {
      await handlePlayPause();
    } else {
      let token = localStorage.getItem("spotify_token");

      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.log("Token expired, refreshing token...");
        await refreshToken();
        token = localStorage.getItem("spotify_token");
      }

      try {
        const playResponse = await fetch(`https://api.spotify.com/v1/me/player/play`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [diary.track.uri],
            device_id: deviceId,
          }),
        });

        if (playResponse.status === 204) {
          setCurrentTrack(diary.track);
          setIsPlaying(true);
        } else {
          console.error("無法播放歌曲", playResponse.statusText);
        }
      } catch (error) {
        console.error("播放歌曲時發生錯誤", error);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!player) {
      console.error("播放器未初始化");
      return;
    }

    try {
      if (isPlaying) {
        console.log("正在暫停音樂");
        await player.pause();
        setIsPlaying(false);
      } else {
        console.log("正在恢復音樂");
        await player.resume();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("播放/暫停音樂時發生錯誤：", error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!diary) {
    return <div className="p-8">Diary not found.</div>;
  }

  return (
    <div className="p-8 h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-none">
          <TiThMenu className="h-8 w-8 cursor-pointer" onClick={() => navigate(-1)} />
        </div>

        <div className="flex-grow text-center">
          <h2 className="text-2xl font-bold">Diary Entry</h2>
        </div>

        <div className="flex-none" style={{ width: "2rem" }}></div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">{diary.date}</h3>
        <div className="flex items-center mb-4">
          <img src={moodIcons[diary.mood]} alt={diary.mood} className="h-10 w-10 mr-2" />
          <span className="text-lg">{diary.mood}</span>
        </div>
        <p className="text-gray-700 mb-6">{diary.content}</p>

        {diary.imageUrls && diary.imageUrls.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {diary.imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-auto rounded-lg"
              />
            ))}
          </div>
        )}

        {/* 音樂播放部分 */}
        {diary.track && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">Music</h4>
            <div className="flex items-center space-x-4">
              <img
                src={diary.track.albumImageUrl}
                alt={diary.track.name}
                className="w-24 h-24 rounded-full"
              />
              <div className="flex-1">
                <p className="text-xl font-semibold">{diary.track.name}</p>
                <p className="text-sm text-gray-400">{diary.track.artists.join(", ")} </p>
              </div>
              <button onClick={handleTrackSelect}>
                {isPlaying ? (
                  <IoPauseCircle size={40} className="text-green-500" />
                ) : (
                  <IoPlayCircle size={40} className="text-green-500" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewDiaryEntry;
