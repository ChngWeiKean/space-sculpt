import {auth, db} from "./firebase";
import {ref, update} from "firebase/database";
import {storage} from "./firebase.js";
import {getDownloadURL, ref as sRef, uploadBytes} from "firebase/storage";
import {deleteUser, signInWithEmailAndPassword, updateEmail, updatePassword} from "firebase/auth";

export const delete_user = async (data) => {
	const {email, password, clinic, role} = data;

	return await signInWithEmailAndPassword(auth, email, password)
		.then((userCredential) => {
			return deleteUser(userCredential.user)
				.then(() => {
					return update(ref(db, `users/${userCredential.user.uid}`), {
						deleted_on: new Date(),
						deleted: true,
						deleted_by: auth.currentUser.uid
					})
				})
				.then(() => {
					if (clinic === null) {
						return {success: true};
					} else {
						const node = role === "Doctor" ? "doctors" : "admins";
						return update(ref(db, `clinics/${clinic}/${node}/${userCredential.user.uid}`), null)
					}
				})
				.then(() => {
					return {success: true};
				})
				.catch((error) => {
					return {error: error};
				})
			.then(() => {
				return {success: true};
			})
			}).catch((error) => {
				return {error: error};
			});
}
