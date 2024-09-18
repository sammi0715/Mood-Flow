import { db } from "./firebase";
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore"; // 從 firebase/firestore 導入
import { getAuth } from "firebase/auth";


export const fetchDiaries = async (userId) => {
    try {
        const diariesRef = collection(db, "diaries");
        const q = query(diariesRef, where("userId", "==", userId));
        const diarySnapshot = await getDocs(q);
        const diaryData = diarySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return diaryData;
    } catch (error) {
        console.error("Error fetching diaries: ", error);
        throw error;
    }
};



export const saveDiaryEntry = async (diaryEntry) => {
    const { userId, date, mood, content } = diaryEntry;

    console.log("保存日記時的 userId:", userId);

    if (!userId) {
        throw new Error("缺少 userId，無法保存日記。");
    }

    try {
        const diariesRef = collection(db, "diaries");
        await addDoc(diariesRef, {
            userId,
            date,
            mood,
            content,
            createdAt: serverTimestamp(),
        });
        console.log("日記保存成功！");
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
};
