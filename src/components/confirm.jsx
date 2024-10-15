import React from "react";

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 px-12 rounded-lg shadow-lg">
        <p className="text-lg mb-4">{message}</p>
        <div className="flex justify-center space-x-4 mt-8">
          <button onClick={onCancel} className="px-2 py-2 bg-gray-300 rounded hover:bg-gray-400">
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-2 py-2 bg-dark-orange text-white rounded hover:bg-amber-500"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
