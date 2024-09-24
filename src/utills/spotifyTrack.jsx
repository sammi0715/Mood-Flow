import { useState, useEffect } from "react";
import { IoPlayCircle, IoPauseCircle } from "react-icons/io5";
import { useSpotifyPlayer } from "./SpotifyPlayer";
import { LuPlusCircle, LuCheckCircle } from "react-icons/lu";
export const SpotifyTracks = ({ onSelectTrack }) => {
  const [tracks, setTracks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTracks, setSelectedTracks] = useState({});
  const { player, handleTrackSelect, fetchWithTokenCheck } = useSpotifyPlayer();

  useEffect(() => {
    const fetchTopTracks = async () => {
      try {
        setIsLoading(true);
        const response = await fetchWithTokenCheck("https://api.spotify.com/v1/me/top/tracks", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch top tracks: ${response.statusText}`);
        }

        const data = await response.json();
        setTracks(data.items || []);
      } catch (error) {
        console.error("Error fetching top tracks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopTracks();
  }, []);

  const handleSearch = async () => {
    if (searchTerm.trim() === "") return;

    try {
      setIsLoading(true);
      const response = await fetchWithTokenCheck(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track&limit=10`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error(`Failed to search tracks: ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResults(data.tracks.items || []);
    } catch (error) {
      console.error("Error searching tracks:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSelectTrackForDiary = (track) => {
    setSelectedTracks((prevState) => {
      const isSelected = !prevState[track.id];

      if (isSelected) {
        console.log(`已選取歌曲: ${track.name}`);
        onSelectTrack(track);
      } else {
        console.log(`取消選擇歌曲: ${track.name}`);
        onSelectTrack(null);
      }

      // 更新選取狀態
      return {
        ...prevState,
        [track.id]: isSelected,
      };
    });
  };

  const handlePlayPause = async (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
      await player.pause();
    } else {
      await handleTrackSelect(track.uri);
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  if (isLoading) {
    return <div>Loading tracks...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search Results Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">搜尋結果：</h2>
        <div className="space-y-4">
          {searchResults.map((track) => (
            <div
              key={track.id}
              className="bg-gray-900 text-white p-4 rounded-lg shadow-lg flex items-center space-x-4"
            >
              <img
                src={track.album.images[0].url}
                alt={track.name}
                className="w-24 h-24 rounded-full"
              />
              <div className="flex-1">
                <p className="text-xl font-semibold">{track.name}</p>
                <p className="text-sm text-gray-400">{track.artists[0].name}</p>
              </div>
              <button onClick={() => handlePlayPause(track)}>
                {currentTrack?.id === track.id && isPlaying ? (
                  <IoPauseCircle size={40} className="text-green-500" />
                ) : (
                  <IoPlayCircle size={40} className="text-green-500" />
                )}
              </button>
              <button
                onClick={() => handleSelectTrack(track)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg ml-2"
              >
                選取歌曲
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Top Tracks Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Top Tracks</h2>
        <div className="space-y-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-gray-900 text-white p-4 rounded-lg shadow-lg flex items-center space-x-4"
            >
              <img
                src={track.album.images[0].url}
                alt={track.name}
                className="w-24 h-24 rounded-full"
              />
              <div className="flex-1">
                <p className="text-xl font-semibold">{track.name}</p>
                <p className="text-sm text-gray-400">{track.artists[0].name}</p>
              </div>
              <button onClick={() => handlePlayPause(track)}>
                {currentTrack?.id === track.id && isPlaying ? (
                  <IoPauseCircle size={40} className="text-green-500" />
                ) : (
                  <IoPlayCircle size={40} className="text-green-500" />
                )}
              </button>
              <button
                onClick={() => handleSelectTrackForDiary(track)}
                className="text-green-500 ml-2"
              >
                {selectedTracks[track.id] ? (
                  <LuCheckCircle size={40} />
                ) : (
                  <LuPlusCircle size={40} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};