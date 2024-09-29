import {auth, db, secondaryAuth} from "./firebase";
import {equalTo, get, onValue, orderByChild, push, query, ref, set, update} from "firebase/database";
import {storage} from "./firebase.js";
import {getDownloadURL, ref as sRef, uploadBytes} from "firebase/storage";
import {deleteUser, signInWithEmailAndPassword, updateEmail, updatePassword} from "firebase/auth";

export const createCategoryAndSubcategories = async (categoryData, subcategoryData) => {
    const { category_name, category_image } = categoryData;

    console.log("Category Image", category_image);

    const categoryRef = ref(db, 'categories');
    const newCategoryRef = push(categoryRef);
    const storageRef = sRef(storage, `categories/${newCategoryRef.key}`);
    let categoryImageUrl;

    let categoryUploadPromise;
    if (category_image) {
        categoryUploadPromise = uploadBytes(storageRef, category_image)
            .then(() => {
                return getDownloadURL(storageRef);
            })
            .then((url) => {
                categoryImageUrl = url;
                return set(ref(db, `categories/${newCategoryRef.key}`), {
                    name: category_name,
                    image: categoryImageUrl,
                    created_on: new Date(),
                    created_by: auth.currentUser.uid,
                });
            });
    } else {
        categoryUploadPromise = set(ref(db, `categories/${newCategoryRef.key}`), {
            name: category_name,
            created_on: new Date(),
            created_by: auth.currentUser.uid,
        });
    }

    return categoryUploadPromise
        .then(() => {
            if (subcategoryData.length === 0) {
                return { success: true };
            }

            const subcategoryRef = ref(db, 'subcategories');
            const subcategoryIds = [];

            const subcategoryPromises = subcategoryData.map((subcategory) => {
                const { name, image } = subcategory;

                const newSubcategoryRef = push(subcategoryRef);
                const storageRef = sRef(storage, `subcategories/${newSubcategoryRef.key}`);
                let subcategoryImageUrl;

                if (image) {
                    return uploadBytes(storageRef, image)
                        .then(() => {
                            return getDownloadURL(storageRef);
                        })
                        .then((url) => {
                            subcategoryImageUrl = url;
                            return set(ref(db, `subcategories/${newSubcategoryRef.key}`), {
                                name: name,
                                image: subcategoryImageUrl,
                                created_on: new Date(),
                                created_by: auth.currentUser.uid,
                                category: newCategoryRef.key
                            });
                        })
                        .then(() => {
                            subcategoryIds.push(newSubcategoryRef.key);
                        });
                } else {
                    return set(ref(db, `subcategories/${newSubcategoryRef.key}`), {
                        name: name,
                        category: newCategoryRef.key, 
                        created_on: new Date(),
                        created_by: auth.currentUser.uid,
                    })
                    .then(() => {
                        subcategoryIds.push(newSubcategoryRef.key);
                    });
                }
            });

            return Promise.all(subcategoryPromises)
                .then(() => {
                    return update(ref(db, `categories/${newCategoryRef.key}`), {
                        subcategories: subcategoryIds
                    });
                })
                .then(() => {
                    return { success: true };
                });
        })
        .catch((error) => {
            return { error: error };
        });
};

export const updateCategoryAndSubcategories = async (id, categoryData, subcategoryData) => {
    const categorySnapshot = await get(ref(db, `categories/${id}`))
    const categoryImageUrl = categorySnapshot.val().image;

    if (categoryData?.category_image !== categoryImageUrl) {
        const storageRef = sRef(storage, `categories/${id}`);
        await uploadBytes(storageRef, categoryData?.category_image)
            .then(() => {
                return getDownloadURL(storageRef);
            })
            .then((url) => {
                return update(ref(db, `categories/${id}`), {
                    name: categoryData?.category_name,
                    image: url,
                    updated_on: new Date(),
                    updated_by: auth.currentUser.uid,
                });
            });
    }
    console.log("Category Name", categoryData?.category_name);
    // Update category name if changed
    if (categoryData?.category_name !== categorySnapshot.val().name) {
        await update(ref(db, `categories/${id}`), {
            name: categoryData?.category_name,
            updated_on: new Date(),
            updated_by: auth.currentUser.uid,
        });
    }

    const updatedSubcategoryIds = []; // Array to collect updated subcategory IDs

    for (const subcategory of subcategoryData) {
        if (subcategory?.id) {
            console.log("Updating subcategory", subcategory);
            const subcategorySnapshot = await get(ref(db, `subcategories/${subcategory?.id}`));
            const subcategoryImageUrl = subcategorySnapshot.val().image;
            if (subcategory?.image !== subcategoryImageUrl) {
                // Update subcategory image
                const storageRef = sRef(storage, `subcategories/${subcategory.id}`);
                await uploadBytes(storageRef, subcategory?.image)
                    .then(() => {
                        return getDownloadURL(storageRef);
                    })
                    .then((url) => {
                        return update(ref(db, `subcategories/${subcategory?.id}`), {
                            name: subcategory?.name,
                            image: url,
                            category: id,
                            updated_on: new Date(),
                            updated_by: auth.currentUser.uid,
                        });
                    });
            }
            
            // Update subcategory name if changed
            if (subcategory?.name !== subcategorySnapshot.val().name) {
                await update(ref(db, `subcategories/${subcategory?.id}`), {
                    name: subcategory?.name,
                    updated_on: new Date(),
                    updated_by: auth.currentUser.uid,
                });
            }                  

            if (subcategory?.isDeleted) {
                // Delete subcategory
                await update(ref(db, `subcategories/${subcategory?.id}`), {
                    deleted_on: new Date(),
                    deleted: true,
                    deleted_by: auth.currentUser.uid,
                    updated_on: new Date(),
                    updated_by: auth.currentUser.uid,
                });
            } else {
                if (subcategorySnapshot.val().deleted) {
                    await update(ref(db, `subcategories/${subcategory?.id}`), {
                        deleted_on: null,
                        deleted: false,
                        deleted_by: null,
                        updated_on: new Date(),
                        updated_by: auth.currentUser.uid,
                    });
                }
            }
            // Add the subcategory ID to the updatedSubcategoryIds array
            updatedSubcategoryIds.push(subcategory?.id);
        } else {
            // Create a new subcategory
            console.log("Creating new subcategory", subcategory);
            console.log("New subcategory image", subcategory?.image)
            const newSubcategoryRef = push(ref(db, 'subcategories'));
            const storageRef = sRef(storage, `subcategories/${newSubcategoryRef.key}`);
            await uploadBytes(storageRef, subcategory?.image)
                .then(() => {
                    return getDownloadURL(storageRef);
                })
                .then((url) => {
                    return set(ref(db, `subcategories/${newSubcategoryRef.key}`), {
                        name: subcategory?.name,
                        image: url,
                        category: id,
                        updated_on: new Date(),
                        updated_by: auth.currentUser.uid,
                    });
                });
            updatedSubcategoryIds.push(newSubcategoryRef.key);
        }
    }
    
    // Update the category with the array of updated subcategory IDs
    await update(ref(db, `categories/${id}`), {
        subcategories: updatedSubcategoryIds
    });

    return { success: true };
}

export const addFurniture = async (furnitureData, furnitureVariants) => {
    const { subcategory, name, description, price, height, width, length, material, care_method, weight, cost } = furnitureData;

    try {
        const furnitureRef = ref(db, 'furniture');
        const newFurnitureRef = push(furnitureRef);
        await set(ref(db, `furniture/${newFurnitureRef.key}`), {
            subcategory: subcategory,
            name: name,
            description: description,
            price: price,
            height: height,
            width: width,
            length: length,
            material: material,
            weight: weight,
            cost: cost,
            care_method: care_method,
            created_on: new Date(),
            created_by: auth.currentUser.uid,
        });

        const subcategoryRef = ref(db, `subcategories/${subcategory}`);
        const subcategorySnapshot = await get(subcategoryRef);
        const furnitureIds = subcategorySnapshot.val().furniture || [];
        furnitureIds.push(newFurnitureRef.key);
        await update(subcategoryRef, {
            furniture: furnitureIds
        });

        const variantsRef = ref(db, `furniture/${newFurnitureRef.key}/variants`);
        const variantPromises = furnitureVariants.map(async (variant) => {
            const { color, image, icon, model, inventory } = variant;
            const variantRef = push(variantsRef);
            let variantImageUrl;
            let variantIconUrl;
            let variantModelUrl;

            const imageRef = sRef(storage, `furniture/${newFurnitureRef.key}/variants/${variantRef.key}/image`);
            await uploadBytes(imageRef, image);
            variantImageUrl = await getDownloadURL(imageRef);

            const iconRef = sRef(storage, `furniture/${newFurnitureRef.key}/variants/${variantRef.key}/icon`);
            await uploadBytes(iconRef, icon);
            variantIconUrl = await getDownloadURL(iconRef);

            const modelRef = sRef(storage, `furniture/${newFurnitureRef.key}/variants/${variantRef.key}/model`);
            await uploadBytes(modelRef, model);
            variantModelUrl = await getDownloadURL(modelRef);

            await set(variantRef, {
                color: color,
                image: variantImageUrl,
                icon: variantIconUrl,
                model: variantModelUrl,
                inventory: inventory
            });
        });

        await Promise.all(variantPromises);

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const updateFurniture = async (furnitureData, furnitureVariants) => {
    const { id, subcategory, name, description, price, height, width, length, material, discount, care_method, weight, cost } = furnitureData;

    console.log("Furniture Data", furnitureData);
    console.log("Furniture Variants", furnitureVariants);

    try {
        const furnitureRef = ref(db, `furniture/${id}`);
        const furnitureSnapshot = await get(furnitureRef);
        const currentSubcategory = furnitureSnapshot.val().subcategory;

        await update(furnitureRef, {
            name: name,
            description: description,
            price: price,
            height: height,
            subcategory: subcategory,
            width: width,
            length: length,
            material: material,
            weight: weight,
            cost: cost,
            discount: discount,
            care_method: care_method,
            updated_on: new Date(),
            updated_by: auth.currentUser.uid,
        });

        if (currentSubcategory !== subcategory) {
            const subcategoryRef = ref(db, `subcategories/${subcategory}`); 
            const subcategorySnapshot = await get(subcategoryRef);
            const furnitureIds = subcategorySnapshot.val().furniture || [];
            furnitureIds.push(id);
            await update(subcategoryRef, {
                furniture: furnitureIds
            });

            const oldSubcategoryRef = ref(db, `subcategories/${currentSubcategory}`);
            const oldSubcategorySnapshot = await get(oldSubcategoryRef);
            const oldFurnitureIds = oldSubcategorySnapshot.val().furniture || [];
            const index = oldFurnitureIds.indexOf(id);
            if (index > -1) {
                oldFurnitureIds.splice(index, 1);
            }
            await update(oldSubcategoryRef, {
                furniture: oldFurnitureIds
            });
        }

        const variantPromises = furnitureVariants.map(async (variant) => {
            if (variant?.id) {
                const variantRef = ref(db, `furniture/${id}/variants/${variant.id}`);
                const variantSnapshot = await get(variantRef);
                const { color, image, icon, model, inventory } = variant;

                if (variantSnapshot.val().color !== color) {
                    await update(variantRef, {
                        color: color
                    });
                }

                if (variantSnapshot.val().inventory !== inventory) {
                    await update(variantRef, {
                        inventory: inventory
                    });
                }

                const imageUrl = variantSnapshot.val()?.image;
                const iconUrl = variantSnapshot.val()?.icon;
                const modelUrl = variantSnapshot.val()?.model;

                console.log("Image URL", imageUrl);
                console.log("Image", image);
                console.log("Icon URL", iconUrl);
                console.log("Icon", icon);
                console.log("Model URL", modelUrl);
                console.log("Model", model);

                if (image !== imageUrl) {
                    const imageRef = sRef(storage, `furniture/${id}/variants/${variant.id}/image`);
                    await uploadBytes(imageRef, image);
                    const imageUrl = await getDownloadURL(imageRef);
                    await update(variantRef, {
                        image: imageUrl
                    });
                }

                if (icon !== iconUrl) {
                    const iconRef = sRef(storage, `furniture/${id}/variants/${variant.id}/icon`);
                    await uploadBytes(iconRef, icon);
                    const iconUrl = await getDownloadURL(iconRef);
                    await update(variantRef, {
                        icon: iconUrl
                    });
                }

                if (model !== modelUrl) {
                    const modelRef = sRef(storage, `furniture/${id}/variants/${variant.id}/model`);
                    await uploadBytes(modelRef, model);
                    const modelUrl = await getDownloadURL(modelRef);
                    await update(variantRef, {
                        model: modelUrl
                    });
                }

                if (variant?.isDeleted) {
                    await update(variantRef, {
                        deleted_on: new Date(),
                        deleted: true,
                        deleted_by: auth.currentUser.uid
                    });
                } else {
                    if (variantSnapshot.val().deleted) {
                        await update(variantRef, {
                            deleted_on: null,
                            deleted: false,
                            deleted_by: null
                        });
                    }
                }
            } else {
                const { color, image, model, inventory } = variant;
                const variantRef = push(ref(db, `furniture/${id}/variants`));
                const imageRef = sRef(storage, `furniture/${id}/variants/${variantRef.key}/image`);
                await uploadBytes(imageRef, image);
                const imageUrl = await getDownloadURL(imageRef);
                const iconRef = sRef(storage, `furniture/${id}/variants/${variantRef.key}/icon`);
                await uploadBytes(iconRef, image);
                const iconUrl = await getDownloadURL(iconRef);
                const modelRef = sRef(storage, `furniture/${id}/variants/${variantRef.key}/model`);
                await uploadBytes(modelRef, model);
                const modelUrl = await getDownloadURL(modelRef);
                await set(variantRef, {
                    color: color,
                    image: imageUrl,
                    icon: iconUrl,
                    model: modelUrl,
                    inventory: inventory
                });
            }
        });

        await Promise.all(variantPromises);

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const deleteFurniture = async (id) => {
    try {
        const furnitureRef = ref(db, `furniture/${id}`);
        const furnitureSnapshot = await get(furnitureRef);
        const subcategory = furnitureSnapshot.val().subcategory;
        await update(furnitureRef, {
            deleted_on: new Date(),
            deleted: true,
            deleted_by: auth.currentUser.uid
        });

        const subcategoryRef = ref(db, `subcategories/${subcategory}`);
        const subcategorySnapshot = await get(subcategoryRef);
        const furnitureIds = subcategorySnapshot.val().furniture || [];
        const index = furnitureIds.indexOf(id);
        if (index > -1) {
            furnitureIds.splice(index, 1);
        }
        await update(subcategoryRef, {
            furniture: furnitureIds
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const restoreFurniture = async (id) => {
    try {
        const furnitureRef = ref(db, `furniture/${id}`);
        const furnitureSnapshot = await get(furnitureRef);
        const subcategory = furnitureSnapshot.val().subcategory;
        await update(furnitureRef, {
            deleted_on: null,
            deleted: false,
            deleted_by: null
        });

        const subcategoryRef = ref(db, `subcategories/${subcategory}`);
        const subcategorySnapshot = await get(subcategoryRef);
        const furnitureIds = subcategorySnapshot.val().furniture || [];
        furnitureIds.push(id);
        await update(subcategoryRef, {
            furniture: furnitureIds
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const delete_user = async (data) => {
	const {email, password} = data;

	return await signInWithEmailAndPassword(secondaryAuth, email, password)
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

export const updateUserProfile = async (userId, data) => {
    const { name, email, contact, role, password } = data;
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
            role: role,
            contact: contact,
        };

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
	
	return await signInWithEmailAndPassword(secondaryAuth, email, password)
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
	
	return await signInWithEmailAndPassword(secondaryAuth, email, password)
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

export const addVoucher = async (data) => {
    const {
        discount_type,
        discount_value,
        start_date,
        expiry_date,
        discount_application,
        minimum_spend,
        customer_eligibility,
        voucher_code,
        auto_redemption_amount,
        redemption_limit,
        terms_and_conditions,
        created_on = new Date(),
        created_by = auth.currentUser.uid,
    } = data;

    try {
        const voucherRef = ref(db, 'vouchers');
        const newVoucherRef = push(voucherRef);
        await set(ref(db, `vouchers/${newVoucherRef.key}`), {
            id: newVoucherRef.key,
            discount_type,
            discount_value,
            start_date,
            expiry_date,
            discount_application,
            minimum_spend,
            customer_eligibility,
            voucher_code,
            auto_redemption_amount,
            redemption_limit,
            redemption_count: 0,
            terms_and_conditions,
            created_on,
            created_by,
        });

        // if customer_eligibility is new, give the voucher to all users with role customers with no orders
        if (customer_eligibility === "new") {
            const usersRef = ref(db, 'users');
            const usersSnapshot = await get(usersRef);
            const users = usersSnapshot.val();
            // filter users with role customer 
            Object.keys(users).forEach((userId) => {
                if (users[userId].role !== "Customer") {
                    delete users[userId];
                }
            });
            console.log("Users", users);

            const userPromises = Object.keys(users).map((userId) => {
                const userOrdersRef = ref(db, `users/${userId}/orders`);
                return get(userOrdersRef)
                    .then((ordersSnapshot) => {
                        if (ordersSnapshot.exists()) {
                            return;
                        }
                        console.log("User has no orders", userId);
                        const userVouchersRef = ref(db, `users/${userId}/vouchers`);
                        return set(userVouchersRef, {
                            [newVoucherRef.key]: true
                        });
                    });
            });

            await Promise.all(userPromises);

            // store userId with true or false in voucher
            const voucherUsersRef = ref(db, `vouchers/${newVoucherRef.key}/users`);
            const userStatus = {};
            Object.keys(users).forEach((userId) => {
                userStatus[userId] = true;
            });
            await set(voucherUsersRef, userStatus);
            // update voucher redemption count
            await update(ref(db, `vouchers/${newVoucherRef.key}`), {
                redemption_count: Object.keys(users).length
            });
        }

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const updateVoucher = async (data) => {
    const {
        id,
        discount_type,
        discount_value,
        start_date,
        expiry_date,
        discount_application,
        minimum_spend,
        customer_eligibility,
        voucher_code,
        auto_redemption_amount,
        terms_and_conditions,
        redemption_limit,
    } = data;

    try {
        const voucherRef = ref(db, `vouchers/${id}`);
        await update(voucherRef, {
            discount_type,
            discount_value,
            start_date,
            expiry_date,
            discount_application,
            minimum_spend,
            customer_eligibility,
            voucher_code,
            auto_redemption_amount,
            terms_and_conditions,
            redemption_limit,
            updated_on: new Date(),
            updated_by: auth.currentUser.uid,
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const deleteVoucher = async (id) => {
    try {
        const voucherRef = ref(db, `vouchers/${id}`);
        await update(voucherRef, {
            deleted_on: new Date(),
            deleted: true,
            deleted_by: auth.currentUser.uid,
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const restoreVoucher = async (id) => {
    try {
        const voucherRef = ref(db, `vouchers/${id}`);
        await update(voucherRef, {
            deleted_on: null,
            deleted: false,
            deleted_by: null,
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const resolveReport = async (id, reportResolveDescription) => {
    try {
        const reportRef = ref(db, `reports/${id}`);
        // Get report data
        const reportSnapshot = await get(reportRef);
        const report = reportSnapshot.val();
        await update(reportRef, {
            resolved: true,
            resolved_description: reportResolveDescription,
            resolved_on: new Date(),
            resolved_by: auth.currentUser.uid,
        });

        const orderRef = ref(db, `orders/${report?.order_id}`);
        // Get order data
        const orderSnapshot = await get(orderRef);
        const order = orderSnapshot.val();
        // update completion_status
        update(orderRef, {
            completion_status: {
                ...order?.completion_status,
                OnHold: null,
                Resolved: new Date().toISOString(),
            },
            reports: id
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
}
