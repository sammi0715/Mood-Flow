import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { fetchDiariesWithMoodStats } from "../utills/firebase-data";
import moodIcons from "../utills/moodIcons";
import { useParams } from "react-router-dom";
import { startOfWeek, startOfMonth, startOfYear, endOfToday, endOfWeek } from "date-fns";
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

const moodCategories = {
  非常愉快: ["快樂", "興奮"],
  愉快: ["開心"],
  情緒中性: ["平靜"],
  不愉快: ["焦慮", "憂鬱"],
  非常不愉快: ["生氣", "悲傷", "哭泣"],
};

const moodLevels = {
  非常愉快: 3,
  愉快: 2.5,
  情緒中性: 2,
  不愉快: 1.5,
  非常不愉快: 1,
};

const categorizeMood = (mood) => {
  for (const [category, moods] of Object.entries(moodCategories)) {
    if (moods.includes(mood)) {
      return category;
    }
  }
  return "情緒中性";
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
    const fetchData = async () => {
      let startDate;
      let endDate;

      if (filter === "week") {
        startDate = startOfWeek(new Date());
        endDate = endOfWeek(new Date());
      } else if (filter === "month") {
        startDate = startOfMonth(new Date());
        endDate = endOfToday();
      } else if (filter === "year") {
        startDate = startOfYear(new Date());
        endDate = endOfToday();
      }

      try {
        const { moodStats, trendData } = await fetchDiariesWithMoodStats(
          userId,
          startDate,
          endDate
        );

        setMoodData(calculatePercentage(moodStats));

        const categorizedTrendData = trendData.map((data) => {
          const category = categorizeMood(data.mood);
          return {
            ...data,
            moodCategory: category,
            moodLevel: moodLevels[category],
            fill: moodColorMap[data.mood],
          };
        });

        setTrendData(categorizedTrendData);
      } catch (error) {
        console.error("Error fetching mood stats and trend data:", error);
      }
    };

    fetchData();
  }, [userId, filter]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { date, mood } = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p>{`Date: ${date}`}</p>
          <p>{`情緒: ${mood}`}</p>
        </div>
      );
    }
    return null;
  };

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
        <div className="flex items-center mb-6">
          <TiThMenu
            className="w-6 h-6 lg:h-8 lg:w-8 mr-4 cursor-pointer text-gray-600 hover:text-gray-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
          <h2 className="text-xl lg:text-2xl ml-4">心情統計</h2>
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
        <div className="mb-10 border border-black rounded-lg p-6">
          <h2 className="text-xl lg:text-2xl mb-4 text-left">心情分佈</h2>
          <div className="flex flex-col items-center mb-10 w-full">
            {moodData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={window.innerWidth < 640 ? 300 : 400} // 在小螢幕下調整高度
              >
                <PieChart>
                  <Pie
                    data={moodData}
                    cx="50%"
                    cy="50%"
                    outerRadius={window.innerWidth < 640 ? 50 : 120} // 調整外半徑以適應小螢幕
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
              </ResponsiveContainer>
            ) : (
              <p>沒有可用的心情數據</p>
            )}
          </div>
          <p className="mt-4 text-lg font-semibold text-center">Keep good mood!</p>
        </div>

        {/* 心情趨勢圖 */}
        <div className="border border-black rounded-lg p-6 ">
          <h2 className="text-xl lg:text-2xl mb-4">心情趨勢</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400} className="ml-4">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  name="Date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("zh-TW", { weekday: "short" })
                  }
                />
                <YAxis
                  dataKey="moodLevel"
                  name="Mood"
                  ticks={[1, 2, 3]}
                  tickFormatter={(value) => {
                    const moodLabels = {
                      1: "非常不愉快",
                      2: "情緒中性",
                      3: "非常愉快",
                    };
                    return moodLabels[value] || "";
                  }}
                  width={90}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  payload={Object.keys(moodColorMap).map((mood) => ({
                    value: mood,
                    type: "circle",
                  }))}
                />
                <Scatter
                  name="Moods"
                  data={trendData}
                  shape={({ cx, cy, payload }) => (
                    <circle cx={cx} cy={cy} r={5} fill={payload.fill} />
                  )}
                />
              </ScatterChart>
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
