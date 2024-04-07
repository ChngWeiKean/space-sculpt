import {createContext, useContext, useEffect, useState} from 'react';
import {onAuthStateChanged} from "firebase/auth";
import {onValue, ref} from "firebase/database";
import {auth, db} from "../../api/firebase.js";


export const AuthProvider = ({children}) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	
	useEffect(() => {
		return onAuthStateChanged(auth, (user) => {
			if (user) {
				const userRef = ref(db, `users/${user.uid}`);
				
				onValue(userRef, (snapshot) => {
					const data = snapshot.val();
					
					if (data) {
						setUser({
							...user,
							...data,
						});
						setLoading(false);
					} else {
						setUser(null);
						setLoading(false);
					}
				});
			} else {
				setUser(null);
				setLoading(false);
			}
		});
	}, []);
	
	const value = {
		user,
		loading
	}
	
	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	)
}

const AuthContext = createContext(null);

export const useAuth = () => {
	return useContext(AuthContext);
}
