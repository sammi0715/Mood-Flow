import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { fetchDiariesWithMoodStats } from "../utills/firebase-data";
import moodIcons from "../utills/moodIcons";
import { useParams } from "react-router-dom";
import { startOfWeek, startOfMonth, startOfYear, endOfToday } from "date-fns"; // date-fns 引入
import { TiThMenu } from "react-icons/ti";
import Sidebar from "../pages/Sidebar";
const moodColorMap = {
  哭泣: "#7e7097",
  悲傷: "#575974",
  生氣: "#ba0a0a",
  憂鬱: "#93cffd",
  焦慮: "#eb3e3e",
  平靜: "#64cab8",
  快樂: "#f49135",
  興奮: "#ec7c85",
  開心: "#f7f584",
};

const calculatePercentage = (moodData) => {
  const total = moodData.reduce((sum, entry) => sum + entry.value, 0);
  return moodData.map((entry) => ({
    ...entry,
    percentage: ((entry.value / total) * 100).toFixed(2) + "%",
  }));
};

const MoodTrack = () => {
  const { userId } = useParams();
  const [moodData, setMoodData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [filter, setFilter] = useState("week");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!userId) {
      console.error("userId 未定義或無效");
      return;
    }

    const fetchData = async () => {
      let startDate;
      const endDate = endOfToday();
      if (filter === "week") {
        startDate = startOfWeek(new Date());
      } else if (filter === "month") {
        startDate = startOfMonth(new Date());
      } else if (filter === "year") {
        startDate = startOfYear(new Date());
      }

      try {
        const { moodStats, trendData } = await fetchDiariesWithMoodStats(
          userId,
          startDate,
          endDate
        );
        setMoodData(calculatePercentage(moodStats));
        setTrendData(trendData);
      } catch (error) {
        console.error("Error fetching mood stats and trend data:", error);
      }
    };

    fetchData();
  }, [userId, filter]);

  const renderCustomLabel = ({ name, percentage, cx, cy, midAngle, outerRadius }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 40;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <image x={x - 25} y={y - 25} href={moodIcons[name]} height={50} width={50} />
        <text x={x} y={y + 30} fill="black" textAnchor="middle" dominantBaseline="central">
          {percentage}
        </text>
      </g>
    );
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  return (
    <div className="flex h-screen">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div className="flex-1 p-8">
        <div className="flex items-center  mb-6">
          <TiThMenu
            className="h-8 w-8  mr-4 cursor-pointer text-gray-600 hover:text-gray-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
          <h2 className="text-2xl ml-4">心情統計</h2>
        </div>
        {/* 選擇篩選條件 */}
        <div className="mb-6 flex justify-end">
          <select
            onChange={handleFilterChange}
            value={filter}
            className="text-lg border p-2 rounded"
          >
            <option value="week">本週</option>
            <option value="month">本月</option>
            <option value="year">今年</option>
          </select>
        </div>

        {/* 心情分布圓餅圖 */}
        <div className="mb-10 border border-black rounded-lg  p-6">
          <h2 className="text-2xl mb-4 text-left">心情分佈</h2>
          <div className="flex flex-col items-center mb-10  ">
            {moodData.length > 0 ? (
              <PieChart width={400} height={500}>
                <Pie
                  data={moodData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={renderCustomLabel}
                  dataKey="value"
                >
                  {moodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={moodColorMap[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} (${props.payload.percentage})`,
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            ) : (
              <p>沒有可用的心情數據</p>
            )}
          </div>
          <p className="mt-4 text-lg font-semibold text-center">Keep good mood!</p>
        </div>

        {/* 心情趨勢圖 */}
        <div className="border border-black rounded-lg p-6">
          <h2 className="text-2xl mb-4">心情趨勢</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis dataKey="mood" type="category" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="mood" stroke="#f8e532" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>沒有可用的趨勢數據</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodTrack;
