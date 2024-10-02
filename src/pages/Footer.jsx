import { useLocation } from "react-router-dom";

function Footer() {
  const location = useLocation();

  const isDiaryCalendar = location.pathname.startsWith("/diary-calendar");

  return (
    <footer
      className={`w-full h-12 bg-amber-100 flex items-center justify-center ${
        isDiaryCalendar ? "fixed bottom-0 left-0" : ""
      } z-10`}
    >
      <div className="flex flex-wrap justify-center">
        <p className="mr-2 xl:mr-12 sm:mr-4 sm:mb-0 text-sm xl:text-base">關於Mood Flow</p>
        <p className="mr-2 xl:mr-12 sm:mr-4 sm:mb-0 text-sm xl:text-base">服務條款</p>
        <p className="mr-2 xl:mr-12 sm:mr-4 sm:mb-0 text-sm xl:text-base">隱私政策</p>
        <p className="mr-2 xl:mr-12 sm:mr-4 sm:mb-0 text-sm xl:text-base">FAQ</p>
        <p className="mr-2 xl:mr-12 sm:mr-4 sm:mb-0 text-sm xl:text-base">聯絡我們</p>
      </div>
    </footer>
  );
}

export default Footer;
