import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../utills/firebase";


const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;


        const userDocRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (!userSnapshot.exists()) {

            await setDoc(userDocRef, {
                name: user.displayName,
                email: user.email,
                userId: user.uid,
                profile_pic: user.photoURL,
                createdAt: new Date(),
            });
        }
        localStorage.setItem("user_uid", user.uid);
        return user;
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
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

export const getCurrentUser = () => {
    return auth.currentUser;
};
