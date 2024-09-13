import { TiThMenu } from "react-icons/ti";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import happy from "../../assets/images/happy.png";
import joy from "../../assets/images/joy.png";
import exiced from "../../assets/images/exiced.png";
import calm from "../../assets/images/calm.png";
import anxiety from "../../assets/images/anxiety.png";
import angry from "../../assets/images/angry.png";
import blue from "../../assets/images/blue.png";
import sad from "../../assets/images/sad.png";
import cry from "../../assets/images/cry.png";
function DiaryCalendar() {
  const calendarData = [
    { day: 1, moodImg: happy, moodText: "I’m in a good mood" },
    { day: 2, moodImg: calm, moodText: "My mood is average" },
    { day: 4, moodImg: anxiety, moodText: "I’m in a bad mood" },
    { day: 6, moodImg: angry, moodText: "I’m very angry today" },
    { day: 7, moodImg: calm, moodText: "My mood is average" },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <TiThMenu className="h-8 w-8" />
        <div className="text-center">
          <h2 className="text-2xl font-bold">September 2024</h2>
        </div>
        <div className="flex items-center">
          <button className="mr-2">
            <FiChevronLeft className="h-6 w-6" />
          </button>
          <button>
            <FiChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 text-center">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <div key={day} className="text-gray-500 font-semibold">
            {day}
          </div>
        ))}

        {Array.from({ length: 30 }, (_, i) => {
          const currentDay = i + 1;
          const dayData = calendarData.find((d) => d.day === currentDay);
          return (
            <div key={currentDay} className="relative border border-gray-200 rounded-lg h-28">
              <div className="absolute top-1 left-1 text-sm font-bold">{currentDay}</div>
              {dayData && (
                <div className="flex flex-col items-center mt-4">
                  <img src={dayData.moodImg} className="h-10 w-10 mb-1" alt="mood" />
                  <p className="text-xs">{dayData.moodText}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-8">
        <button className="bg-gray-200 rounded-full h-12 w-12 flex items-center justify-center text-3xl">+</button>
      </div>
    </div>
  );
}
export default DiaryCalendar;
