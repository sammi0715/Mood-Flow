import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../utills/firebase";
import { TiThMenu } from "react-icons/ti";
import moodIcons from "../../utills/moodIcons";
import { IoPlayCircle, IoPauseCircle } from "react-icons/io5";
import { useSpotifyPlayer } from "../../utills/SpotifyPlayer";

function ViewDiaryEntry() {
  const { diaryId } = useParams();
  const navigate = useNavigate();
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isPlaying, currentTrack, handlePlayPause, handleTrackSelect, player, spotifyToken } =
    useSpotifyPlayer();

  const handleResetTrack = async () => {
    if (player && currentTrack) {
      try {
        await player.pause();

        await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=0`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
            "Content-Type": "application/json",
          },
        });

        await handleTrackSelect(diary.track.uri);
      } catch (error) {
        console.error("重置音樂播放時發生錯誤: ", error);
      }
    }
  };

  useEffect(() => {
    const fetchDiary = async () => {
      try {
        const diaryRef = doc(db, "diaries", diaryId);
        const diarySnap = await getDoc(diaryRef);
        if (diarySnap.exists()) {
          setDiary(diarySnap.data());
          if (diarySnap.data().track) {
            handleResetTrack();
          }
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

  const handlePlayButton = async () => {
    if (currentTrack) {
      await handlePlayPause();
    } else {
      await handleTrackSelect(diary.track.uri);
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

      <div className="bg-white rounded-lg shadow-lg p-6 min-h-full overflow-auto">
        <h3 className="text-xl font-semibold mb-4">{diary.date}</h3>
        <div className="flex items-center mb-4">
          <img src={moodIcons[diary.mood]} alt={diary.mood} className="h-10 w-10 mr-2" />
          <span className="text-lg">{diary.mood}</span>
        </div>
        <p className="text-gray-700 mb-6">{diary.content}</p>

        {diary.imageUrls && diary.imageUrls.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
            {diary.imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-auto object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* 音樂播放部分 */}
        {diary.track && (
          <div className="mt-10">
            <h4 className="text-lg font-semibold mb-4">Music</h4>
            <div className="flex items-center space-x-4 mb-10">
              <img
                src={diary.track.albumImageUrl}
                alt={diary.track.name}
                className="w-24 h-24 rounded-full"
              />
              <div className="flex-1">
                <p className="text-xl font-semibold">{diary.track.name}</p>
                <p className="text-sm text-gray-400">{diary.track.artists.join(", ")} </p>
              </div>
              <button onClick={handlePlayButton}>
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
