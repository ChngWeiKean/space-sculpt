import {
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut
} from "firebase/auth";
import {auth, db, storage} from "./firebase.js";
import {ref, set} from "firebase/database";
import {getDownloadURL, ref as sRef, uploadBytes} from "firebase/storage";

export const register = async (data, asAdmin=false) => {
	const {email, password, name, contact, role="Customer"} = data;
	const authObj = auth;
	
	return await createUserWithEmailAndPassword(authObj, email, password).then(async (newUser) => {
		if (newUser) {
			return await set(ref(db, `users/${newUser.user.uid}`), {
				uid: newUser.user.uid,
				created_on: new Date().toISOString(),
				created_by: asAdmin ? auth.currentUser.uid : newUser.user.uid,
				email: newUser.user.email,
				password: password,
				role: role,
				name: name,
				contact: contact,
			})
			.then(() => {
				return newUser.user;
			})
			.catch((error) => {
				throw {error: error};
			});
		} else {
			return {error: "Error creating user"};
		}
	})
	.catch((error) => {
		console.log(error);
		return {error: error};
	});
}

export const register_admin = async (data) => {
	const {email, password, name, contact, role="Admin"} = data;
    const authObj = auth;
	
	return await createUserWithEmailAndPassword(authObj, email, password).then(async (newUser) => {
		if (newUser) {
			return await set(ref(db, `users/${newUser.user.uid}`), {
				uid: newUser.user.uid,
				created_on: new Date().toISOString(),
				created_by: newUser.user.uid,
				email: newUser.user.email,
				password: password,
				contact: contact,
				role: role,
				name: name
			}).then(() => {
				return newUser.user;
			}).catch((error) => {
				return {error: error};
			});
		} else {
			return {error: "Error creating user"};
		}
	})
	.catch((error) => {
		return {error: error};
	});
}

export const login = async (cred) => {
	const {email, password} = cred;
	return await signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
		return userCredential.user;
	}).catch((error) => {
		console.log(error);
		return {error: error};
	});
}

export const logout = async () => {
	signOut(auth).then(() => {
		console.log("logged out");
	}).catch((error) => {
		console.log(error);
	});
}

export const forgot_password = async (email) => {
	return await sendPasswordResetEmail(auth, email).then(() => {
		return {success: "Email sent"};
	}).catch((error) => {
		return {error: error};
	});
}