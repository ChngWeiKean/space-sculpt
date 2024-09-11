import {auth, db} from "./firebase";
import {equalTo, get, onValue, orderByChild, push, query, ref, set, update} from "firebase/database";
import {deleteUser, signInWithEmailAndPassword, updateEmail, updatePassword} from "firebase/auth";
import {fetchAndActivate, getValue} from "firebase/remote-config";
import {remoteConfig} from "./firebase.js";
import {storage} from "./firebase.js";
import {getDownloadURL, ref as sRef, uploadBytes} from "firebase/storage";
import CryptoJS from 'crypto-js';

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
                return {success: true};
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

const generateIV = () => CryptoJS.lib.WordArray.random(16);

const encryptAES = (text, key) => {
    const iv = generateIV();
    const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Utf8.parse(key), {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    const combined = iv.concat(encrypted.ciphertext);
    return combined.toString(CryptoJS.enc.Base64);
};

export const addCard = async (userId, card) => {
    const { number, name, expiry, cvc, billing_address } = card;

    fetchAndActivate(remoteConfig)
        .then(() => {
            const private_key = getValue(remoteConfig, 'private_key').asString();

            const encrypted_number = encryptAES(number, private_key);
            const encrypted_expiry = encryptAES(expiry, private_key);
            const encrypted_name = encryptAES(name, private_key);
            const encrypted_cvc = encryptAES(cvc, private_key);
            const encrypted_billing_address = encryptAES(billing_address, private_key);

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

            const encrypted_number = encryptAES(number, private_key);
            const encrypted_expiry = encryptAES(expiry, private_key);
            const encrypted_name = encryptAES(name, private_key);
            const encrypted_cvc = encryptAES(cvc, private_key);
            const encrypted_billing_address = encryptAES(billing_address, private_key);

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

export const redeemVoucher = async (voucher_code, user_id) => {
    try {
        const voucherQuery = query(ref(db, "vouchers"), orderByChild("voucher_code"), equalTo(voucher_code));
        const voucherSnapshot = await get(voucherQuery);

        if (!voucherSnapshot.exists()) {
            return { error: "Voucher not found" };
        }

        const voucherData = voucherSnapshot.val();
        const voucher_id = Object.keys(voucherData)[0];

        let redemption_count = voucherData.redemption_count || 0;
        redemption_count = Number(redemption_count);

        const { redemption_limit } = voucherData;

        if (redemption_limit && redemption_count >= redemption_limit) {
            return { error: "Redemption limit reached" };
        }

        const userVouchersRef = ref(db, `users/${user_id}/vouchers`);
        const userVouchersSnapshot = await get(userVouchersRef);
        const userVouchers = userVouchersSnapshot.val();

        if (userVouchers && userVouchers[voucher_id] === true) {
            return { error: "Voucher already redeemed by user" };
        }

        const voucherRef = ref(db, `vouchers/${voucher_id}`);
        await update(voucherRef, {
            redemption_count: redemption_count + 1
        });

        const voucherUsersRef = ref(db, `vouchers/${voucher_id}/users`);
        await update(voucherUsersRef, {
            [user_id]: true
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const placeOrder = async (data) => {
    const { 
        user_id,
        items,
        address,
        payment,
        payment_method,
        subtotal,
        shipping,
        weight,
        discount,
        voucher,
        total,
        shipping_date,
        shipping_time,
        remarks,
    } = data;
    
    try {
        // Fetch existing order IDs and determine the max order ID
        const ordersRef = ref(db, 'orders');
        const ordersSnapshot = await get(ordersRef);
        let maxOrderId = 0;
        
        if (ordersSnapshot.exists()) {
            const orders = ordersSnapshot.val();
            Object.values(orders).forEach(order => {
                const orderId = parseInt(order.order_id.replace('OID', ''));
                if (orderId > maxOrderId) {
                    maxOrderId = orderId;
                }
            });
        }
        
        // Generate new order ID
        const newOrderId = `OID${maxOrderId + 1}`;

        // Create a new order reference with auto-generated key
        const newOrderRef = push(ordersRef);
        const newOrderKey = newOrderRef.key;

        // Prepare the order data with the generated order ID
        const orderData = {
            order_id: newOrderId,
            user_id: user_id,
            items: items,
            address: address,
            payment: payment,
            payment_method: payment_method,
            subtotal: subtotal,
            shipping: shipping,
            weight: parseFloat(weight).toFixed(2),
            discount: parseFloat(discount).toFixed(2),
            voucher: voucher,
            total: total,
            shipping_date: shipping_date,
            shipping_time: shipping_time,
            remarks: remarks,
            completion_status: {
                Pending: new Date().toISOString(),
                ReadyForShipping: null,
                Shipping: null,
                Arrived: null,
                Completed: null
            },
            created_on: new Date().toISOString()
        };

        // Set the order data to the new order reference
        await set(newOrderRef, orderData);

        // If voucher is applied, add order_id to the voucher/orders
        if (voucher) {
            try {
                const voucherRef = ref(db, `vouchers/${voucher.id}/orders`);
                
                // Get current orders array (if any)
                const voucherSnapshot = await get(voucherRef);
                let currentOrders = [];
                if (voucherSnapshot.exists()) {
                    currentOrders = voucherSnapshot.val();
                }

                // Append the new order_id to the current orders array
                currentOrders.push(newOrderKey);

                // Update the database with the updated orders array
                await set(voucherRef, currentOrders);

                // Update the user's voucher to be redeemed
                const userVoucherRef = ref(db, `users/${user_id}/vouchers/${voucher.id}`);
                await set(userVoucherRef, false);

                // Update the voucher's user to be redeemed
                const voucherUserRef = ref(db, `vouchers/${voucher.id}/users/${user_id}`);
                await set(voucherUserRef, false);                
            } catch (error) {
                console.error("Error adding order to voucher:", error);
            }
        }

        // Store order id in user/orders
        try {
            const userOrderRef = ref(db, `users/${user_id}/orders`);
            const userOrderSnapshot = await get(userOrderRef);
            let userOrders = [];
            if (userOrderSnapshot.exists()) {
                userOrders = userOrderSnapshot.val();
            }

            userOrders.push(newOrderKey);
            await set(userOrderRef, userOrders);
        } catch (error) {
            console.error("Error adding order to user:", error);
        }

        // Group items by furniture ID
        const groupedItems = items.reduce((acc, item) => {
            if (!acc[item.id]) {
                acc[item.id] = {
                    selected_variants: [item.variantId],
                    quantity: item.quantity,
                    price: item.price * item.quantity, // Calculating total price for the item
                    discount: item.discount ? item.discount : 0 // Ensure discount is always set
                };
            } else {
                acc[item.id].selected_variants.push(item.variantId);
                acc[item.id].quantity += item.quantity;
                acc[item.id].price += item.price * item.quantity; // Increment total price
            }
            return acc;
        }, {});

        // Store order details in furniture/orders and update inventory
        try {
            for (const itemId of Object.keys(groupedItems)) {
                const item = groupedItems[itemId];
                const furnitureOrderRef = ref(db, `furniture/${itemId}/orders`);
                const furnitureOrderSnapshot = await get(furnitureOrderRef);
                let furnitureOrders = [];
                if (furnitureOrderSnapshot.exists()) {
                    furnitureOrders = furnitureOrderSnapshot.val();
                }
                furnitureOrders.push({
                    order_id: newOrderId,
                    created_on: new Date().toISOString(), // Assuming order creation time
                    customer_id: user_id,
                    discount: item.discount,
                    quantity: item.quantity,
                    selected_variants: item.selected_variants,
                    price: item.price
                });
                await set(furnitureOrderRef, furnitureOrders);

                // Deduct from inventory for each selected variant
                for (const variantId of item.selected_variants) {
                    const variantInventoryRef = ref(db, `furniture/${itemId}/variants/${variantId}/inventory`);
                    const variantInventorySnapshot = await get(variantInventoryRef);

                    if (variantInventorySnapshot.exists()) {
                        const currentInventory = variantInventorySnapshot.val();
                        const newInventory = Math.max(0, currentInventory - item.quantity); // Prevent negative inventory
                        await set(variantInventoryRef, newInventory);
                    }
                }
            }
        } catch (error) {
            console.error("Error adding order to furniture or updating inventory:", error);
        }

        try {
            const userCartRef = ref(db, `users/${user_id}/cart`);
            await set(userCartRef, null);
        } catch (error) {
            console.error("Error clearing cart:", error);
        }

        return { success: true };
    } catch (error) {
        throw error;
    }
};

export const completeOrder = async (order_id) => {
    try {
        const orderRef = ref(db, `orders/${order_id}`);

        // Retrieve the current completion_status
        const snapshot = await get(orderRef);
        const orderData = snapshot.val();
        
        if (!orderData.completion_status) {
            throw new Error("Completion status not found");
        }

        // Update only the Completed status
        const updatedCompletionStatus = {
            ...orderData.completion_status,
            Completed: new Date().toISOString()
        };

        await update(orderRef, {
            completion_status: updatedCompletionStatus
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const reportDelivery = async (data) => {
    const { orderID, description, reportedItems } = data;

    try {
        const orderRef = ref(db, `orders/${orderID}`);
        const orderSnapshot = await get(orderRef);
        const orderData = orderSnapshot.val();

        if (!orderData) {
            throw new Error("Order not found");
        }

        // Update order.completion_status to "OnHold"
        const updatedCompletionStatus = {
            ...orderData.completion_status,
            OnHold: new Date().toISOString()
        };

        await update(orderRef, {
            completion_status: updatedCompletionStatus
        });

        // Create a new report in the separate "reports" node
        const reportsRef = ref(db, `reports`);
        const newReportRef = push(reportsRef);
        await set(newReportRef, {
            order_id: orderID,
            description: description,
            items: reportedItems,
            created_on: new Date().toISOString()
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const updateShipping = async (order_id, data) => {
    const { shipping_date, shipping_time } = data;
    try {
        const orderRef = ref(db, `orders/${order_id}`);
        await update(orderRef, {
            shipping_date: shipping_date,
            shipping_time: shipping_time
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
}