import { TiThMenu } from "react-icons/ti";
import happy from "../../assets/images/happy.png";
import joy from "../../assets/images/joy.png";
import excited from "../../assets/images/excited.png";
import calm from "../../assets/images/calm.png";
import anxiety from "../../assets/images/anxiety.png";
import angry from "../../assets/images/angry.png";
import blue from "../../assets/images/blue.png";
import sad from "../../assets/images/sad.png";
import cry from "../../assets/images/cry.png";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "../../utills/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import SpotifyLogin from "../../utills/spotifyLogin";
import { SpotifyTracks } from "../../utills/spotify-auth";

function NewDiaryEntry() {
  const navigate = useNavigate();
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedDate = searchParams.get("date");
  const [selectedMood, setSelectedMood] = useState(null);
  const [diaryContent, setDiaryContent] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("spotify_token");
    setSpotifyToken(token);
  }, []);

  const handleTrackSelect = (track) => {
    const simplifiedTrack = {
      id: track.id,
      name: track.name,
      uri: track.uri,
      artists: track.artists.map((artist) => artist.name),
      albumImageUrl: track.album.images[0]?.url,
    };

    setSelectedTrack(simplifiedTrack);
  };

  const moods = [
    { img: happy, label: "開心" },
    { img: joy, label: "快樂" },
    { img: excited, label: "興奮" },
    { img: calm, label: "平靜" },
    { img: anxiety, label: "焦慮" },
    { img: angry, label: "生氣" },
    { img: blue, label: "憂鬱" },
    { img: sad, label: "悲傷" },
    { img: cry, label: "哭泣" },
  ];

  const handleMoodSelect = (mood) => setSelectedMood(mood);

  const handleDiaryChange = (event) => setDiaryContent(event.target.value);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + uploadedImages.length > 3) {
      alert("您最多只能上傳三張圖片。");
      return;
    }

    files.forEach((file) => convertToBase64(file));
  };

  const convertToBase64 = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setUploadedImages((prevImages) => [...prevImages, reader.result]);
    };
    reader.onerror = (error) => {
      console.error("圖片轉換失敗: ", error);
      alert("圖片轉換失敗，請重新嘗試。");
    };
  };

  const handleRemoveImage = (index) => {
    setUploadedImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedMood || !diaryContent.trim()) {
      alert("請選擇一個心情並輸入日記內容。");
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      alert("使用者尚未登入");
      setLoading(false);
      return;
    }

    try {
      const diaryEntry = {
        date: selectedDate,
        mood: selectedMood,
        content: diaryContent,
        userId: user.uid,
        track: selectedTrack || null,
        imageUrls: uploadedImages.length > 0 ? uploadedImages : null,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "diaries"), diaryEntry);
      alert("日記已成功保存！");
      setSelectedMood(null);
      setDiaryContent("");
      setUploadedImages([]);
      navigate(`/diary-calendar/${user.uid}`);
    } catch (error) {
      console.error("保存日記時出錯: ", error);
      alert("保存日記時出錯，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <TiThMenu className="h-8 w-8" />
      <h1 className="text-3xl font-bold text-center mt-4 mb-4">Today's Mood</h1>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-center mb-6">
          {selectedDate ? selectedDate : "No date selected"}
        </h2>

        <div className="flex flex-wrap justify-around items-center mb-6">
          {moods.map((mood) => (
            <div
              key={mood.label}
              className={`flex flex-col items-center cursor-pointer transition-transform duration-200 ${
                selectedMood === mood.label ? "scale-125" : "scale-100"
              }`}
              onClick={() => handleMoodSelect(mood.label)}
            >
              <img
                src={mood.img}
                className={`h-16 ${selectedMood === mood.label ? "h-20" : "h-16"}`}
                alt={mood.label}
              />
              {selectedMood === mood.label && <p className="mt-2 text-lg">{mood.label}</p>}
            </div>
          ))}
        </div>

        <textarea
          className="w-full bg-gray-100 h-64 rounded-lg p-4 resize-none"
          placeholder="輸入今天的日記..."
          value={diaryContent}
          onChange={handleDiaryChange}
        />

        <div className="relative w-full h-auto rounded-lg mb-6">
          <div className="flex items-center justify-start space-x-4">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/jpg,image/jpeg,image/png,image/gif"
              onChange={handleImageUpload}
              multiple
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="h-10 w-10 text-lg font-bold bg-gray-200 rounded-full flex justify-center items-center">
                +
              </div>
            </label>
            <p className="text-sm text-gray-500">最多上傳三張圖片</p>
          </div>

          {uploadedImages.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-4">Music</h3>

        {spotifyToken && <SpotifyTracks onSelectTrack={handleTrackSelect} />}

        <div className="flex justify-center mt-6">
          <button
            className={`bg-yellow-400 text-black px-8 py-2 rounded-lg transition-colors duration-200 ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-500"
            }`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "保存中..." : "送出"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewDiaryEntry;
