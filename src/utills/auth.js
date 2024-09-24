import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../utills/firebase";


const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;


        const userDocRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userDocRef);

        let needsUsername = false;


        if (!userSnapshot.exists()) {

            await setDoc(userDocRef, {
                name: null,
                email: user.email,
                userId: user.uid,
                profile_pic: user.photoURL,
                privacy_status: "public",
                createdAt: new Date(),
            });
            needsUsername = true;
        } else {
            const userData = userSnapshot.data();

            if (!userData.hasOwnProperty('privacy_status')) {
                await updateDoc(userDocRef, { privacy_status: "public" });
            }
        }

        localStorage.setItem("user_uid", user.uid);
        return { user, needsUsername };
    } catch (error) {
        console.error("Google 登入錯誤:", error);
        throw error;
    }
};

//註冊邏輯
export const signUpUser = async (name, email, password, profile_pic) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            name,
            email,
            userId: user.uid,
            profile_pic: profile_pic,
            privacy_status: "public",
            createdAt: new Date(),

        });
        return user;
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            throw new Error("這個電子信箱已經被使用，請使用其他電子信箱註冊。");
        } else {
            throw error;
        }
    }
};
export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;


        localStorage.setItem('user_uid', user.uid);

        return user;
    } catch (error) {
        throw error;
    }
};


export const getCurrentUser = () => {
    return auth.currentUser;
};
// 設定帳號名稱的邏輯
export const handleSetUsername = async (username) => {
    const usernameRegex = /^[a-zA-Z0-9]{4,15}$/;
    if (!usernameRegex.test(username)) {
        throw new Error("帳號名稱必須是 4-15 個字元的英文字母或數字");
    }

    try {
        const user = auth.currentUser;  // 獲取當前登入的使用者
        if (!user) {
            throw new Error("無法獲取當前使用者資訊，請重新登入");
        }
        const userDocRef = doc(db, "users", user.uid);

        // 更新 Firestore 中的 name 欄位
        await updateDoc(userDocRef, { name: username });
        return { success: true };
    } catch (error) {
        console.error("設定帳號名稱錯誤:", error);
        throw error;
    }
};