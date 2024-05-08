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
            updated_at: new Date().toISOString(),
            updated_by: auth.currentUser.uid
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
}