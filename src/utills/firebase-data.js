import { db, storage, auth } from "./firebase";
import { collection, getDocs, addDoc, query, where, serverTimestamp, updateDoc, deleteDoc, getDoc, doc, orderBy, onSnapshot, writeBatch } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { format } from "date-fns";

export const fetchDiaries = async (userId) => {
    try {
        const diariesRef = collection(db, "diaries");
        const q = query(diariesRef, where("userId", "==", userId));
        const diarySnapshot = await getDocs(q);

        if (diarySnapshot.empty) {
            console.warn("No diary entries found for this user.");
            return [];
        }

        const diaryData = diarySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return diaryData;
    } catch (error) {
        console.error("Error fetching diaries:", error);
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
        const allowedViewers = await getFriendIds(userId);

        const diariesRef = collection(db, "diaries");
        await addDoc(diariesRef, {
            userId,
            date,
            mood,
            content,
            allowedViewers,
            createdAt: serverTimestamp(),
        });
        console.log("日記保存成功！");
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
};

export const updateDiary = async (diaryId, updatedData) => {
    try {
        const diaryRef = doc(db, "diaries", diaryId);


        const userId = auth.currentUser.uid;


        const diarySnap = await getDoc(diaryRef);
        if (!diarySnap.exists()) {
            throw new Error("日記不存在");
        }
        const diaryData = diarySnap.data();


        if (userId !== diaryData.userId) {
            throw new Error("無權限更新此日記");
        }


        const allowedViewers = await getFriendIds(userId);

        await updateDoc(diaryRef, {
            ...updatedData,
            allowedViewers,
            updatedAt: serverTimestamp(),
        });

        console.log("日記更新成功！");
    } catch (error) {
        console.error("更新日記錯誤:", error);
        throw error;
    }
};


export const deleteDiary = async (diaryId) => {
    try {
        const diaryRef = doc(db, "diaries", diaryId);
        await deleteDoc(diaryRef);
        console.log("日記刪除成功！")
    } catch (error) {
        console.error("Error deleting diary:", error);
        throw error;
    }
};

export const fetchUserData = async (userId) => {
    try {
        const userDocRef = doc(db, "users", userId);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {

            const userData = userSnapshot.data() || {};
            return {
                ...userData,
                name: userData.name || null,
                profile_pic: userData.profile_pic || null
            };
        } else {
            console.error("使用者文檔不存在");
            return null;
        }
    } catch (error) {
        console.error("獲取使用者資料時發生錯誤: ", error);
        throw error;
    }
};

export const fetchHistoryData = async (userId, startDate, endDate) => {
    try {
        const diariesRef = collection(db, "diaries");


        const start = format(new Date(startDate), "yyyy-MM-dd");
        const end = format(new Date(endDate), "yyyy-MM-dd");

        const q = query(
            diariesRef,
            where("userId", "==", userId),
            where("date", ">=", start),
            where("date", "<=", end),
            orderBy("date", "desc")
        );

        const diarySnapshot = await getDocs(q);
        const diaryData = diarySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return diaryData;
    } catch (error) {
        console.error("Error fetching history data: ", error);
        throw error;
    }
};


export const simplifyTrack = (track) => {
    return {
        id: track.id,
        name: track.name,
        uri: track.uri,
        artists: track.artists.map((artist) => artist.name),
        albumImageUrl: track.album.images[0]?.url,
    };
};

export const handleImageUpload = (event, uploadedImages, setUploadedImages) => {
    return new Promise((resolve, reject) => {
        if (!event || !event.target || !event.target.files) {
            reject(new Error("未提供有效的事件對象"));
            return;
        }

        const files = Array.from(event.target.files);
        if (files.length + uploadedImages.length > 3) {
            reject(new Error("您最多只能上傳三張圖片。"));
            return;
        }

        files.forEach((file) => {

            if (!file.type.startsWith("image/")) {
                ("請上傳圖片檔案");
                reject(new Error("無效的檔案類型"));
                return;
            }


            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                alert("圖片大小不得超過 5MB");
                reject(new Error("檔案過大"));
                return;
            }


            const filePreviewURL = URL.createObjectURL(file);
            setUploadedImages((prevImages) => [...prevImages, filePreviewURL]);


            const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`上傳進度: ${progress}%`);
                },
                (error) => {
                    console.error("圖片上傳失敗: ", error);
                    reject(error);
                },
                () => {

                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        setUploadedImages((prevImages) =>
                            prevImages.map((img) => (img === filePreviewURL ? downloadURL : img))
                        );
                        resolve(downloadURL);
                    });
                }
            );
        });
    });
};

export const uploadImageToStorage = (file, setUploadedImages) => {
    const storageRef = ref(storage, `images/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
        "state_changed",
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`上傳進度: ${progress}%`);
        },
        (error) => {

            console.error("圖片上傳失敗: ", error);
        },
        () => {

            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                setUploadedImages((prevImages) => [...prevImages, downloadURL]);
            });
        }
    );
};

export const handleRemoveImage = (index, setUploadedImages) => {
    setUploadedImages((prevImages) => prevImages.filter((_, i) => i !== index));
};

export const aggregateMoodData = (diaryData) => {
    const moodCounts = diaryData.reduce((acc, diary) => {
        const mood = diary.mood;
        if (acc[mood]) {
            acc[mood]++;
        } else {
            acc[mood] = 1;
        }
        return acc;
    }, {});


    const formattedData = Object.keys(moodCounts).map((mood) => ({
        name: mood,
        value: moodCounts[mood],
    }));

    return formattedData;
};

export const fetchDiariesWithMoodStats = async (userId, startDate, endDate) => {
    try {
        const diariesRef = collection(db, "diaries");

        // 查詢指定日期範圍內的日記資料
        const q = query(
            diariesRef,
            where("userId", "==", userId),
            where("date", ">=", format(startDate, "yyyy-MM-dd")), // 開始日期
            where("date", "<=", format(endDate, "yyyy-MM-dd")), // 結束日期
            orderBy("date", "asc")
        );
        console.log("Start Date: ", format(startDate, "yyyy-MM-dd"));
        console.log("End Date: ", format(endDate, "yyyy-MM-dd"));

        const diarySnapshot = await getDocs(q);

        if (diarySnapshot.empty) {
            console.warn("No diary entries found for this user.");
            return { diaries: [], moodStats: [], trendData: [] };
        }

        const diaryData = diarySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        // 統計心情數據
        const moodStats = aggregateMoodData(diaryData);

        // 將心情轉換為數據以便用於趨勢圖
        const trendData = diaryData.map((diary) => ({
            date: diary.date, // 假設 date 是 YYYY-MM-DD 格式
            mood: diary.mood, // 直接保留中文心情名稱
        }));
        console.log(trendData);
        return {
            diaries: diaryData,
            moodStats,
            trendData, // 返回趨勢圖的資料
        };

    } catch (error) {
        console.error("Error fetching diaries: ", error);
        throw error;
    }
};

export const updateUserData = async (userId, updatedData) => {
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, updatedData);
        console.log("使用者資料更新成功！");
    } catch (error) {
        console.error("更新使用者資料時發生錯誤: ", error);
        throw error;
    }
};

export const fetchFriends = async (userId) => {
    try {
        const friendsRef = collection(db, "users", userId, "friends");
        const snapshot = await getDocs(friendsRef);
        const friendsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return friendsList;
    } catch (error) {
        console.error("Error fetching friends: ", error);
        throw error;
    }
};

// 獲取好友請求
export const fetchFriendRequests = async (userId) => {
    try {
        const friendRequestsRef = collection(db, "users", userId, "friend_requests");
        const snapshot = await getDocs(friendRequestsRef);
        const requestsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return requestsList;
    } catch (error) {
        console.error("Error fetching friend requests: ", error);
        throw error;
    }
};

// 發送好友邀請
export const sendFriendRequest = async (senderId, targetUser) => {
    if (senderId === targetUser.id) {
        alert("該帳戶為目前使用者");
    }


    try {

        const senderRef = doc(db, `users/${senderId}`);
        const senderSnapshot = await getDoc(senderRef);

        if (!senderSnapshot.exists()) {
            throw new Error("發送者資料不存在");
        }

        const senderData = senderSnapshot.data();


        const targetFriendRequestsRef = collection(db, `users/${targetUser.id}/friend_requests`);
        await addDoc(targetFriendRequestsRef, {
            userId: senderId,
            name: senderData.name,
            email: senderData.email,
            status: "pending",
        });

        console.log("好友邀請已發送！");
    } catch (error) {
        console.error("發送好友邀請失敗：", error);
        throw error;
    }
};


export const searchUserByName = async (searchQuery) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("name", "==", searchQuery));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error searching user: ", error);
        throw error;
    }
};



export const acceptFriendRequest = async (senderId, receiverId) => {
    try {
        const batch = writeBatch(db);


        const senderData = await fetchUserData(senderId);
        const receiverData = await fetchUserData(receiverId);


        const receiverFriendRef = doc(db, `users/${receiverId}/friends/${senderId}`);
        batch.set(receiverFriendRef, {
            userId: senderId,
            name: senderData.name,
            email: senderData.email,
            addedAt: serverTimestamp(),
        });


        const senderFriendRef = doc(db, `users/${senderId}/friends/${receiverId}`);
        batch.set(senderFriendRef, {
            userId: receiverId,
            name: receiverData.name,
            email: receiverData.email,
            addedAt: serverTimestamp(),
        });

        const friendRequestQuery = query(
            collection(db, `users/${receiverId}/friend_requests`),
            where("userId", "==", senderId),
            where("status", "==", "pending")
        );
        const requestSnapshot = await getDocs(friendRequestQuery);
        requestSnapshot.forEach((requestDoc) => {
            const requestRef = doc(db, `users/${receiverId}/friend_requests/${requestDoc.id}`);
            batch.update(requestRef, { status: "accept" });
        });
        await batch.commit();

        console.log("雙方已成為好友！");
    } catch (error) {
        console.error("接受好友邀請時錯誤：", error);
        throw error;
    }
};

export const deleteFriendRequest = async (userId, requestId) => {
    try {
        const requestRef = doc(db, `users/${userId}/friend_requests/${requestId}`);
        await deleteDoc(requestRef);
        console.log("好友邀請已刪除！");
    } catch (error) {
        console.error("刪除好友邀請失敗：", error);
        throw error;
    }
};

export const updateAllDiariesAllowedViewers = async (userId) => {
    try {

        const allowedViewers = await getFriendIds(userId);


        const diariesRef = collection(db, "diaries");
        const q = query(diariesRef, where("userId", "==", userId));
        const diarySnapshot = await getDocs(q);


        const updatePromises = diarySnapshot.docs.map((doc) => {
            const diaryRef = doc.ref;
            return updateDoc(diaryRef, { allowedViewers });
        });

        await Promise.all(updatePromises);
        console.log(`已更新用户 ${userId} 的所有日记的 allowedViewers。`);
    } catch (error) {
        console.error("更新日记的 allowedViewers 時出錯:", error);
        throw error;
    }
};



export const fetchDiariesWithPermission = async (userId, friendId) => {
    try {
        const diariesRef = collection(db, "diaries");
        const q = query(
            diariesRef,
            where("userId", "==", friendId),
            where("allowedViewers", "array-contains", userId),
            orderBy("date", "desc")
        );
        const diarySnapshot = await getDocs(q);
        const diaries = diarySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return diaries;
    } catch (error) {
        console.error("Error fetching diaries with permission: ", error);
        return [];
    }
};
export const getFriendIds = async (userId) => {
    try {
        const friendsRef = collection(db, `users/${userId}/friends`);
        const snapshot = await getDocs(friendsRef);
        const friendIds = snapshot.docs.map((doc) => doc.data().userId);
        return friendIds;
    } catch (error) {
        console.error("获取好友ID列表时出错:", error);
        throw error;
    }
};

// 刪除好友
export const deleteFriend = async (currentUserId, friendId) => {
    try {
        console.log("Current User ID:", currentUserId);
        console.log("Friend ID:", friendId);
        const batch = writeBatch(db);


        const currentUserFriendRef = doc(db, `users/${currentUserId}/friends/${friendId}`);
        batch.delete(currentUserFriendRef);


        const friendUserRef = doc(db, `users/${friendId}/friends/${currentUserId}`);
        batch.delete(friendUserRef);

        await batch.commit();
        console.log(`成功刪除好友 ${friendId}`);
    } catch (error) {
        console.error("刪除好友時發生錯誤:", error);
        throw error;
    }
};


// 實時監聽好友列表
export const listenToFriends = (userId, callback) => {
    const friendsRef = collection(db, "users", userId, "friends");
    const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
        const friendsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        callback(friendsList);
    }, (error) => {
        console.error("Error listening to friends: ", error);
    });
    return unsubscribe;
};

// 實時監聽好友請求
export const listenToFriendRequests = (userId, callback) => {
    const friendRequestsRef = collection(db, "users", userId, "friend_requests");
    const unsubscribe = onSnapshot(friendRequestsRef, (snapshot) => {
        const requestsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        callback(requestsList);
    }, (error) => {
        console.error("Error listening to friend requests: ", error);
    });
    return unsubscribe;
};


export const markRequestAsRead = async (userId, requestId) => {
    const requestRef = doc(db, `users/${userId}/friend_requests/${requestId}`);
    await updateDoc(requestRef, { isRead: true });
};

// 新增留言
export const addComment = async (diaryId, comment) => {
    try {
        const currentUser = auth.currentUser;
        const commentsRef = collection(db, `diaries/${diaryId}/comments`);
        await addDoc(commentsRef, {
            userId: currentUser.uid,
            content: comment,
            createdAt: serverTimestamp(),
        });
        console.log("留言添加成功！");
    } catch (error) {
        console.error("添加留言時發生錯誤:", error);
        throw error;
    }
};


// 獲取日記的所有留言
export const fetchComments = async (diaryId) => {
    try {
        const commentsRef = collection(db, `diaries/${diaryId}/comments`);
        const q = query(commentsRef, orderBy("createdAt", "asc"));
        const commentsSnapshot = await getDocs(q);
        const comments = commentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return comments;
    } catch (error) {
        console.error("獲取留言時發生錯誤:", error);
        throw error;
    }
};

// 更新愛心按讚狀態
export const toggleLikeDiary = async (diaryId, currentLikes) => {
    try {
        const diaryRef = doc(db, "diaries", diaryId);
        const userId = auth.currentUser.uid;
        let updatedLikes = currentLikes;


        if (currentLikes.includes(userId)) {
            updatedLikes = currentLikes.filter(id => id !== userId);
        } else {
            updatedLikes = [...currentLikes, userId];
        }

        await updateDoc(diaryRef, { likes: updatedLikes });
        console.log("按讚狀態更新成功！");
    } catch (error) {
        console.error("更新按讚狀態時發生錯誤:", error);
        throw error;
    }
};
