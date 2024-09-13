import { TiThMenu } from "react-icons/ti";
import happy from "../../assets/images/happy.png";
import joy from "../../assets/images/joy.png";
import exiced from "../../assets/images/exiced.png";
import calm from "../../assets/images/calm.png";
import anxiety from "../../assets/images/anxiety.png";
import angry from "../../assets/images/angry.png";
import blue from "../../assets/images/blue.png";
import sad from "../../assets/images/sad.png";
import cry from "../../assets/images/cry.png";

function NewDiaryEntry() {
  return (
    <div className="p-4">
      <TiThMenu className="h-8 w-8" />
      <h1 className="text-3xl font-bold text-center mt-4 mb-4">Today's Mood</h1>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-center mb-6">9/08(Sun)</h2>
        <div className="flex justify-around items-center mb-6">
          <div className="flex flex-col items-center">
            <img src={happy} className="h-16" />
            <p>開心</p>
          </div>

          <img src={joy} className="h-16" />
          <img src={exiced} className="h-16" />
          <img src={calm} className="h-16" />
          <img src={anxiety} className="h-16" />
          <img src={angry} className="h-16" />
          <img src={blue} className="h-16" />
          <img src={sad} className="h-16" />
          <img src={cry} className="h-16" />
        </div>
        <div>
          <textarea className="w-full bg-gray-100 h-64 rounded-lg p-4 " placeholder="輸入今天的日記..." />

          <div className="relative w-full  h-20 rounded-lg mb-6">
            <div className="absolute bottom-2 right-2 flex items-center justify-center bg-white p-2 rounded-full shadow-lg">
              {/* 隱藏的文件輸入框和自訂上傳按鈕 */}
              <input type="file" id="file-upload" className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="h-10 w-10 text-lg font-bold bg-gray-200 rounded-full flex justify-center items-center">+</div>
              </label>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Music</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center border-solid border">
            <img src={happy} className="h-24 w-24" alt="Music Cover" />
            <div className="ml-2.5">
              <p>INVU</p>
              <p>Taeyeon</p>
            </div>
          </div>
          <div className="flex items-center border-solid border">
            <img src={joy} className="h-24 w-24" alt="Music Cover" />
            <div className="ml-2.5">
              <p>INVU</p>
              <p>Taeyeon</p>
            </div>
          </div>
          <div className="flex items-center border-solid border">
            <img src={calm} className="h-24 w-24" alt="Music Cover" />

            <div className="ml-2.5">
              <p>INVU</p>
              <p>Taeyeon</p>
            </div>
          </div>
          <div className="flex items-center border-solid border">
            <img src={anxiety} className="h-24 w-24" alt="Music Cover" />
            <div className="ml-2.5">
              <p>INVU</p>
              <p>Taeyeon</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-6">
          <button className="bg-yellow-400 text-black px-8 py-2 rounded-lg">送出</button>
        </div>
      </div>
    </div>
  );
}
export default NewDiaryEntry;
