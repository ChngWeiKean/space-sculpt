import {auth, db} from "./firebase";
import {equalTo, get, onValue, orderByChild, push, query, ref, set, update} from "firebase/database";
import {storage} from "./firebase.js";
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
        await push(cartRef, { furnitureId: furnitureId, quantity: 1, variantId: variantId });

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