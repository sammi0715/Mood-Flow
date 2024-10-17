# 心情日記專案

![React](https://img.shields.io/badge/React-v18.3.1-blue) ![Firebase](https://img.shields.io/badge/Firebase-v10.13.1-orange)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v3.4.11-blue)![Spotify API](https://img.shields.io/badge/Spotify-API-green)

這個專案讓使用者可以記錄每日心情、上傳圖片，並使用 Spotify 選擇當天的代表歌曲。使用者還可以回顧過去的心情，並查看情緒的分佈與趨勢。

## 主要功能

- **每日心情記錄**：使用者可以記錄當天的心情，選擇一首 Spotify 歌曲作為代表，並上傳最多 3 張圖片。
- **Spotify 音樂播放**：可以選擇並播放 Spotify 上的歌曲來代表當天的心情。
- **歷史回顧**：使用者可以查看過去的日記，包括「上週的今天」，或篩選特定區間來回顧日記內容。
- **情緒分佈與趨勢圖**：視覺化每週、每月和每年的情緒趨勢，幫助使用者了解情緒變化。
- **社群功能**：使用者可以查看好友列表，並瀏覽好友的心情日記等社群互動。

## 使用技術

- **React**：
  - 作為前端框架，主要運用 function component 和 Hooks（如 useState、useEffect、useReducer、useContext 等）來打造使用者介面。
- **Tailwind CSS**：
  - 用於快速建立自訂化的使用者介面，同時支援響應式設計。
- **React Context**：
  - 實作 SpotifyPlayerContext，負責全域狀態的管理，以便在多個元件之間共享數據與同步狀態。
- **Date-fns**：
  - 用來處理日期和時間的各種操作，應用於月曆顯示及回顧功能，確保日期處理的準確性和一致性。
- **Spotify API**：
  - 透過整合 Spotify API，使用 OAuth 2.0 進行身分驗證，實現音樂播放、搜尋以及歌曲選擇等功能。
- **GSAP**：
  - 用於首頁動畫效果，增強使用者介面的視覺吸引力及互動性。
- **Recharts**：
  - 用於數據視覺化，將使用者的心情記錄轉換為圖表，便於數據的直觀呈現與分析。
- **Firebase**：
  - 作為後端服務，負責部署與託管應用程式。使用 Firestore 進行數據儲存和管理，Authentication 處理用戶驗證及第三方登入功能，Storage 則用於存放使用者上傳的圖片。

## 使用說明

- **註冊/登入**：首次使用請先註冊帳號，已有帳號者可直接登入或連結第三方 Google 登入
- **連結 Spotify**：點擊右上角的 Spotify 按鈕，授權連結您的帳號
- **撰寫日記**：點選月曆上的日期，開始記錄您的心情和想法並選擇音樂照片等
- **探索功能**：使用側邊選單探索其他功能，如心情統計、歷史回顧、社群等

## Spotify 登入

本專案需要整合 Spotify 以提供音樂播放功能。  
請輸入以下帳戶資訊登入 Spotify：

帳號：moodflow2024@gmail.com  
密碼：2024@Moodflow
