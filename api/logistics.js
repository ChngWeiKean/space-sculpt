import {auth, db, secondaryAuth} from "./firebase";
import {equalTo, get, onValue, orderByChild, push, query, ref, set, update} from "firebase/database";
import {storage} from "./firebase.js";
import {getDownloadURL, ref as sRef, uploadBytes} from "firebase/storage";
import {deleteUser, signInWithEmailAndPassword, updateEmail, updatePassword} from "firebase/auth";

export const updateShopAddress = async (addressData) => {
    const { name, address, place_id } = addressData;

    try {
        const settingsRef = ref(db, `settings/address`);
        await update(settingsRef, {
            name: name,
            address: address,
            place_id: place_id
        });

        const settings = ref(db, `settings`);
        await update(settings, {
            updated_at: new Date().toISOString(),
            updated_by: auth.currentUser.uid
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating address:", error);
        throw error;
    }
}

export const updateSettings = async (settings) => {
    const { 
        standard_shipping_fee,
        delivery_offset,
        shipping_fee_threshold,
        distance_threshold_for_standard_delivery_fee,
        extra_delivery_charges_per_kilometer,
        initial_delivery_time,
        end_delivery_time,
        special_handling_charges,
        maximum_weight_load,
        extra_weight_fee_per_kilogram,
        cash_on_delivery_threshold,
        e_wallet_threshold,
    } = settings;

    try {
        const settingsRef = ref(db, `settings`);
        await update(settingsRef, {
            standard_shipping_fee,
            delivery_offset,
            shipping_fee_threshold,
            distance_threshold_for_standard_delivery_fee,
            extra_delivery_charges_per_kilometer,
            initial_delivery_time,
            end_delivery_time,
            special_handling_charges,
            maximum_weight_load,
            extra_weight_fee_per_kilogram,
            cash_on_delivery_threshold,
            e_wallet_threshold,
            updated_at: new Date().toISOString(),
            updated_by: auth.currentUser.uid
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
}

export const updateOrderStatus = async (orderID, status) => {
    try {
        const orderRef = ref(db, `orders/${orderID}`);

        // Fetch the current completion_status from the order
        const snapshot = await get(orderRef);
        const orderData = snapshot.val();

        let updatedCompletionStatus = {};
        
        // If there is already a completion_status, retain the existing statuses
        if (orderData && orderData.completion_status) {
            updatedCompletionStatus = { ...orderData.completion_status };
        }

        // Add the new status with the current timestamp
        updatedCompletionStatus[status] = new Date().toISOString();

        // Update the order in the database
        await update(orderRef, {
            completion_status: updatedCompletionStatus,
            updated_at: new Date().toISOString(),
            updated_by: auth.currentUser.uid
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
}

export const assignOrderToDriver = async (orderID, newDriverID) => {
    try {
        const orderRef = ref(db, `orders/${orderID}`);
        const orderSnapshot = await get(orderRef);
        const orderData = orderSnapshot.val();

        // Check if the order has already been assigned to a driver
        if (orderData.driver_id) {
            const currentDriverID = orderData.driver_id;

            // Remove the order from the current driver's pending orders list
            const currentDriverRef = ref(db, `users/${currentDriverID}`);
            const currentDriverSnapshot = await get(currentDriverRef);
            const currentDriverData = currentDriverSnapshot.val();
            if (currentDriverData) {
                const updatedPendingOrders = currentDriverData.pending_orders.filter(id => id !== orderID);
                await update(currentDriverRef, {
                    pending_orders: updatedPendingOrders
                });
            }
        }

        // Assign the order to the new driver
        await update(orderRef, {
            driver_id: newDriverID,
            updated_at: new Date().toISOString(),
            updated_by: auth.currentUser.uid
        });

        // Add the order id to the new driver's pending orders list
        const newDriverRef = ref(db, `users/${newDriverID}`);
        const newDriverSnapshot = await get(newDriverRef);
        const newDriverData = newDriverSnapshot.val();
        if (newDriverData) {
            const newPendingOrders = newDriverData.pending_orders || [];
            newPendingOrders.push(orderID);
            await update(newDriverRef, {
                pending_orders: newPendingOrders
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error assigning order to driver:", error);
        throw error;
    }
};