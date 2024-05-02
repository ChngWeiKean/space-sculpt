import {auth, db} from "./firebase";
import {equalTo, get, onValue, orderByChild, push, query, ref, set, update} from "firebase/database";
import {deleteUser, signInWithEmailAndPassword, updateEmail, updatePassword} from "firebase/auth";
import {fetchAndActivate, getValue} from "firebase/remote-config";
import {remoteConfig} from "./firebase.js";
import {storage} from "./firebase.js";
import { encrypt, decrypt } from 'n-krypta'
import {getDownloadURL, ref as sRef, uploadBytes} from "firebase/storage";

export const addToFavourites = async (furnitureId, userId) => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnap = await get(userRef);
        const user = userSnap.val();

        const furnitureRef = ref(db, `furniture/${furnitureId}`);
        const furnitureSnap = await get(furnitureRef);
        const furniture = furnitureSnap.val();

        if (!user || !furniture) {
            throw new Error("User or furniture not found");
        }

        const updateUserFavourites = async () => {
            if (!user.favourites) {
                user.favourites = [];
            }

            const index = user.favourites.indexOf(furnitureId);
            if (index !== -1) {
                user.favourites.splice(index, 1);
            } else {
                user.favourites.push(furnitureId);
            }

            await update(userRef, { favourites: user.favourites });
        };

        const updateFurnitureFavourites = async () => {
            if (!furniture.favourites) {
                furniture.favourites = [];
            }

            const index = furniture.favourites.indexOf(userId);
            if (index !== -1) {
                furniture.favourites.splice(index, 1);
            } else {
                furniture.favourites.push(userId);
            }

            await update(furnitureRef, { favourites: furniture.favourites });
        };

        await Promise.all([updateUserFavourites(), updateFurnitureFavourites()]);

        return { success: true };
    } catch (error) {
        console.error("Error adding to favourites:", error);
        throw error;
    }
};

export const addToCart = async (furnitureId, userId, variantId) => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnap = await get(userRef);
        const user = userSnap.val();

        const furnitureRef = ref(db, `furniture/${furnitureId}`);
        const furnitureSnap = await get(furnitureRef);
        const furniture = furnitureSnap.val();

        if (!user || !furniture) {
            throw new Error("User or furniture not found");
        }

        const cartRef = ref(db, `users/${userId}/cart`);
        await push(cartRef, { 
                furnitureId: furnitureId, 
                quantity: 1, 
                variantId: variantId,
                created_on: new Date().toISOString()
             });

        return { success: true };
    } catch (error) {
        console.error("Error adding to cart:", error);
        throw error;
    }
}

export const removeFromCart = async (furnitureId, userId, cartId) => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnap = await get(userRef);
        const user = userSnap.val();

        if (!user || !user.cart) {
            throw new Error("User or cart not found");
        }

        const cartRef = ref(db, `users/${userId}/cart/${cartId}`);
        await set(cartRef, null);

        return { success: true };
    } catch (error) {
        console.error("Error removing from cart:", error);
        throw error;
    }
}

export const updateCart = async (furnitureId, userId, quantity, cartId) => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnap = await get(userRef);
        const user = userSnap.val();

        if (!user || !user.cart) {
            throw new Error("User or cart not found");
        }

        const cartRef = ref(db, `users/${userId}/cart/${cartId}`);
        await update(cartRef, { quantity: quantity });

        return { success: true };
    } catch (error) {
        console.error("Error updating cart:", error);
        throw error;
    }
}

export const addAddress = async (userId, address) => {
    const { name, formatted_address, place_id } = address;
    let isDefault = false; 

    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnap = await get(userRef);
        const user = userSnap.val();

        if (!user) {
            throw new Error("User not found");
        }

        const addressesRef = ref(db, `users/${userId}/addresses`);
        const addressesSnap = await get(addressesRef);
        const addresses = addressesSnap.val();

        if (!addresses || Object.keys(addresses).length === 0) {
            isDefault = true; 
        }

        const newAddressRef = push(addressesRef);
        await set(newAddressRef, { 
            name: name,
            address: formatted_address,
            place_id: place_id,
            isDefault: isDefault,
        });

        return { success: true };
    } catch (error) {
        console.error("Error adding address:", error);
        throw error;
    }
};

export const updateAddress = async (userId, addressId, address) => {
    const { name, formatted_address, place_id, isDefault } = address;
    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnap = await get(userRef);
        const user = userSnap.val();

        if (!user) {
            throw new Error("User not found");
        }

        const addressRef = ref(db, `users/${userId}/addresses/${addressId}`);
        await set(addressRef, { 
            name: name,
            address: formatted_address,
            place_id: place_id,
            isDefault: isDefault,
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating address:", error);
        throw error;
    }
}

export const deleteAddress = async (userId, addressId) => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnap = await get(userRef);
        const user = userSnap.val();

        if (!user) {
            throw new Error("User not found");
        }

        const addressRef = ref(db, `users/${userId}/addresses/${addressId}`);
        await set(addressRef, null);

        return { success: true };
    } catch (error) {
        console.error("Error deleting address:", error);
        throw error;
    }
}

export const updateDefaultAddress = async (userId, addressId) => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnap = await get(userRef);
        const user = userSnap.val();

        if (!user) {
            throw new Error("User not found");
        }

        const addressRef = ref(db, `users/${userId}/addresses`);
        const addressSnap = await get(addressRef);
        const addresses = addressSnap.val();

        if (!addresses) {
            throw new Error("Addresses not found");
        }

        for (const key in addresses) {
            addresses[key].isDefault = key === addressId;
        }

        await set(addressRef, addresses);

        return { success: true };
    } catch (error) {
        console.error("Error updating default address:", error);
        throw error;
    }
}

export const updateProfile = async (userId, data) => {
    const { name, email, contact, gender, date_of_birth, profile_picture, password } = data;
    console.log(data);

    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnap = await get(userRef);
        const user = userSnap.val();

        if (!user) {
            throw new Error("User not found");
        }

        const updateData = {
            name: name,
            contact: contact,
        };

        if (gender) {
            updateData.gender = gender
        }

        if (date_of_birth) {
            updateData.date_of_birth = date_of_birth
        }

        if (profile_picture) {
            if (profile_picture !== user.profile_picture) {
                const storageRef = sRef(storage, `users/${userId}`);
                await uploadBytes(storageRef, profile_picture);

                const url = await getDownloadURL(storageRef);
                updateData.profile_picture = url;                
            }
        }

        if (password !== user.password) {
            updatePassword(user, password);
        }

        if (email !== user.email) {
            updateEmail(user, email);
        }
        console.log(updateData);
        await update(userRef, updateData);

        return { success: true };
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
}

export const update_email = async (data, new_email) => {
	const {uid, email, password} = data;
	
	return await signInWithEmailAndPassword(auth, email, password)
		.then((userCredential) => {
			return updateEmail(userCredential.user, new_email).then(() => {
				return update(ref(db, `users/${uid}`), {
					email: new_email
				}).then(() => {
					return {success: true};
				}).catch((error) => {
					throw {error: error};
				});
			}).catch((error) => {
				throw {error: error};
			})
		.catch((error) => {
			throw {error: error};
		});
	}).catch((error) => {
		throw {error: error};
	});
}

export const update_password = async (data, new_password) => {
	const {uid, email, password} = data;
	
	return await signInWithEmailAndPassword(auth, email, password)
		.then((userCredential) => {
			return updatePassword(userCredential.user, new_password).then(() => {
				return update(ref(db, `users/${uid}`), {
					password: new_password
				}).then(() => {
					return {success: true};
				}).catch((error) => {
					throw {error: error};
				});
			}).catch((error) => {
				throw {error: error};
			})
		.catch((error) => {
			throw {error: error};
		});
	}).catch((error) => {
		throw {error: error};
	});
}

export const addCard = async (userId, card) => {
    const { number, name, expiry, cvc, billing_address } = card;

    fetchAndActivate(remoteConfig)
        .then(() => {
            const private_key = getValue(remoteConfig, 'private_key').asString();
            const encrypted_number = encrypt(number, private_key);
            const encrypted_expiry = encrypt(expiry, private_key);
            const encrypted_name = encrypt(name, private_key);
            const encrypted_cvc = encrypt(cvc, private_key);
            const encrypted_billing_address = encrypt(billing_address, private_key);

            const cardRef = ref(db, `users/${userId}/cards`);
            const newCardRef = push(cardRef);
            set(newCardRef, {
                id: newCardRef.key,
                number: encrypted_number,
                name: encrypted_name,
                cvc: encrypted_cvc,
                expiry: encrypted_expiry,
                billing_address: encrypted_billing_address
            });            
        })
        .catch((err) => {
            console.error(err);
        });
}

export const editCard = async (userId, cardId, card) => {
    const { number, name, expiry, cvc, billing_address } = card;

    fetchAndActivate(remoteConfig)
        .then(() => {
            const private_key = getValue(remoteConfig, 'private_key').asString();
            const encrypted_number = encrypt(number, private_key);
            const encrypted_expiry = encrypt(expiry, private_key);
            const encrypted_name = encrypt(name, private_key);
            const encrypted_cvc = encrypt(cvc, private_key);
            const encrypted_billing_address = encrypt(billing_address, private_key);

            const cardRef = ref(db, `users/${userId}/cards/${cardId}`);
            update(cardRef, {
                number: encrypted_number,
                name: encrypted_name,
                cvc: encrypted_cvc,
                expiry: encrypted_expiry,
                billing_address: encrypted_billing_address
            });            
        })
        .catch((err) => {
            console.error(err);
        });
}

export const deleteCard = async (userId, cardId) => {
    try {
        const cardRef = ref(db, `users/${userId}/cards/${cardId}`);
        await set(cardRef, null);

        return { success: true };
    } catch (error) {
        console.error("Error deleting card:", error);
        throw error;
    }
}