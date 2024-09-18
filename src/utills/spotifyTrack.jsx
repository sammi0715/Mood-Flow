import { useState, useEffect } from "react";
import { IoPlayCircle, IoPauseCircle } from "react-icons/io5";
import { useSpotifyPlayer } from "./SpotifyPlayer";

export const SpotifyTracks = ({ onSelectTrack }) => {
  const [tracks, setTracks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const handlePlayPause = async (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
      await player.pause();
    } else {
      await handleTrackSelect(track.uri);
      setCurrentTrack(track);
      setIsPlaying(true);

      onSelectTrack(track);
    }
  };

  if (isLoading) {
    return <div>Loading tracks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜尋歌曲..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg w-full"
        />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-2">
          搜尋
        </button>
      </div>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
