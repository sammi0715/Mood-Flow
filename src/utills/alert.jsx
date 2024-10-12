import React from "react";
import { IoClose } from "react-icons/io5";
function CustomAlert({ message, onClose, onConfirm }) {
  return (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 justify-center w-[340px] p-4 py-6 bg-white opacity-95 text-black flex justify-between items-center shadow-lg z-50 rounded-lg">
      <span>{message}</span>
      <button
        onClick={() => {
          onClose();
          if (onConfirm) {
            onConfirm();
          }
        }}
        className="ml-4 bg-white text-black px-2 py-1 rounded"
      >
        <IoClose />
      </button>
    </div>
  );
}

export default CustomAlert;
