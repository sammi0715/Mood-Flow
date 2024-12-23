import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../utils/firebase";


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


export const signUpUser = async (name, email, password, profile_pic) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        localStorage.setItem("user_uid", user.uid);

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

export const handleSetUsername = async (username) => {
    const usernameRegex = /^[a-zA-Z0-9]{4,15}$/;
    if (!usernameRegex.test(username)) {
        throw new Error("帳號名稱必須是 4-15 個字元的英文字母或數字");
    }

    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("無法獲取當前使用者資訊，請重新登入");
        }
        const userDocRef = doc(db, "users", user.uid);


        await updateDoc(userDocRef, { name: username });
        return { success: true };
    } catch (error) {
        console.error("設定帳號名稱錯誤:", error);
        throw error;
    }
};