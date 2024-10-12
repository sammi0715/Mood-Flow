import { useState, useEffect } from "react";
import { IoPlayCircle, IoPauseCircle } from "react-icons/io5";
import { useSpotifyPlayer } from "./SpotifyPlayerContext";
import { LuPlusCircle, LuCheckCircle } from "react-icons/lu";
import Alert from "./alert";
export const SpotifyTracks = ({
  onSelectTrackForDiary,
  onPlayTrack,
  currentTrack,
  isPlaying,
  onPlayPause,
}) => {
  const [tracks, setTracks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTracks, setSelectedTracks] = useState({});
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertConfirm, setAlertConfirm] = useState(null);
  const { fetchWithTokenCheck } = useSpotifyPlayer();

  useEffect(() => {
    const fetchTopTracks = async () => {
      try {
        setIsLoading(true);
        const response = await fetchWithTokenCheck("https://api.spotify.com/v1/me/top/tracks", {
          method: "GET",
        });

        if (!response.ok) {
          const errorData = await response.json();
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
    setSelectedTracks({
      [track.id]: true,
    });
    console.log(`已選取歌曲: ${track.name}`);
    onSelectTrackForDiary(track);
  };

  const handlePlayTrack = async (track) => {
    if (currentTrack?.id === track.id) {
      onPlayPause();
    } else {
      await onPlayTrack(track);
    }
  };

  if (isLoading) {
    return <div>Loading tracks...</div>;
  }

  return (
    <div className="space-y-4 p-5">
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜尋歌曲..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg w-full"
        />
        <button
          onClick={handleSearch}
          className="bg-light-orange text-white px-4 py-2 rounded-lg mt-2"
        >
          搜尋
        </button>
      </div>
      {/* Search Results Section */}
      <div>
        <h2 className="text-2xl mb-4">搜尋結果：</h2>
        <div className="space-y-4">
          {searchResults.map((track) => (
            <div
              key={track.id}
              className="bg-gray-900 text-white p-4 w-full rounded-lg shadow-lg flex items-center space-x-3"
            >
              <img
                src={track.album.images[0].url}
                alt={track.name}
                className="w-12 h-12 lg:w-24 lg:h-24 rounded-full"
              />
              <div className="flex-1">
                <p className="text-sm lg:text-xl">{track.name}</p>
                <p className="text-sm text-gray-400">{track.artists[0].name}</p>
              </div>
              <button onClick={() => handlePlayTrack(track)}>
                {currentTrack?.id === track.id && isPlaying ? (
                  <IoPauseCircle className="text-green-500 ml-2 w-8 h-8 lg:w-10 lg:h-10" />
                ) : (
                  <IoPlayCircle className="text-green-500 ml-2 w-8 h-8 lg:w-10 lg:h-10" />
                )}
              </button>
              <button
                onClick={() => handleSelectTrackForDiary(track)}
                className="text-green-500 ml-2"
              >
                {selectedTracks[track.id] ? (
                  <LuCheckCircle className="text-green-500 ml-2 w-8 h-8 lg:w-10 lg:h-10" />
                ) : (
                  <LuPlusCircle className="text-green-500 ml-2 w-8 h-8 lg:w-10 lg:h-10" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Top Tracks Section */}
      <div className="">
        <h2 className="text-2xl mb-4">Top Tracks</h2>
        <div className="space-y-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-gray-900 text-white p-4 w-full rounded-lg shadow-lg flex items-center space-x-3"
            >
              <img
                src={track.album.images[0].url}
                alt={track.name}
                className="w-12 h-12 lg:w-24 lg:h-24 rounded-full"
              />
              <div className="flex-1">
                <p className="text-sm lg:text-xl">{track.name}</p>
                <p className="text-xs text-gray-400">{track.artists[0].name}</p>
              </div>
              <button onClick={() => handlePlayTrack(track)}>
                {currentTrack?.id === track.id && isPlaying ? (
                  <IoPauseCircle className="text-green-500 w-8 h-8 lg:w-10 lg:h-10" />
                ) : (
                  <IoPlayCircle className="text-green-500 w-8 h-8 lg:w-10 lg:h-10" />
                )}
              </button>
              <button onClick={() => handleSelectTrackForDiary(track)}>
                {selectedTracks[track.id] ? (
                  <LuCheckCircle className="text-green-500 ml-2 w-8 h-8 lg:w-10 lg:h-10" />
                ) : (
                  <LuPlusCircle className="text-green-500 ml-2 w-8 h-8 lg:w-10 lg:h-10" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
      {alertMessage && (
        <Alert
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
          onConfirm={alertConfirm}
        />
      )}
    </div>
  );
};
