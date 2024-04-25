import {auth, db} from "./firebase";
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
                    image: categoryImageUrl
                });
            });
    } else {
        categoryUploadPromise = set(ref(db, `categories/${newCategoryRef.key}`), {
            name: category_name
        });
    }

    return categoryUploadPromise
        .then(() => {
            if (subcategoryData.length === 0) {
                return { success: true };
            }

            // Create a reference to the subcategories collection
            const subcategoryRef = ref(db, 'subcategories');

            // Create an array to store subcategory IDs
            const subcategoryIds = [];

            // Create promises to upload subcategory data and images
            const subcategoryPromises = subcategoryData.map((subcategory) => {
                const { name, image } = subcategory;

                // Push a new subcategory reference
                const newSubcategoryRef = push(subcategoryRef);

                // Create a storage reference for the subcategory image
                const storageRef = sRef(storage, `subcategories/${newSubcategoryRef.key}`);
                let subcategoryImageUrl;

                // Upload subcategory image if available
                if (image) {
                    return uploadBytes(storageRef, image)
                        .then(() => {
                            return getDownloadURL(storageRef);
                        })
                        .then((url) => {
                            subcategoryImageUrl = url;
                            // Set subcategory data including the category ID
                            return set(ref(db, `subcategories/${newSubcategoryRef.key}`), {
                                name: name,
                                image: subcategoryImageUrl,
                                category: newCategoryRef.key // Store the category ID
                            });
                        })
                        .then(() => {
                            // Push the subcategory ID to the array
                            subcategoryIds.push(newSubcategoryRef.key);
                        });
                } else {
                    // Set subcategory data including the category ID
                    return set(ref(db, `subcategories/${newSubcategoryRef.key}`), {
                        name: name,
                        category: newCategoryRef.key // Store the category ID
                    })
                    .then(() => {
                        // Push the subcategory ID to the array
                        subcategoryIds.push(newSubcategoryRef.key);
                    });
                }
            });

            // Wait for all subcategory promises to complete
            return Promise.all(subcategoryPromises)
                .then(() => {
                    // Update the category with the array of subcategory IDs
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

    console.log("Category Data", categoryData);
    console.log("Subcategory Data", subcategoryData);

    const categorySnapshot = await get(ref(db, `categories/${id}`))
    const categoryImageUrl = categorySnapshot.val().image;
    console.log("Category Image URL", categoryImageUrl);
    if (categoryData?.category_image !== categoryImageUrl) {
        // Update category image
        const storageRef = sRef(storage, `categories/${id}`);
        await uploadBytes(storageRef, categoryData?.category_image)
            .then(() => {
                return getDownloadURL(storageRef);
            })
            .then((url) => {
                return update(ref(db, `categories/${id}`), {
                    name: categoryData?.category_name,
                    image: url
                });
            });
    }
    console.log("Category Name", categoryData?.category_name);
    // Update category name if changed
    if (categoryData?.category_name !== categorySnapshot.val().name) {
        await update(ref(db, `categories/${id}`), {
            name: categoryData?.category_name
        });
    }

    const updatedSubcategoryIds = []; // Array to collect updated subcategory IDs

    for (const subcategory of subcategoryData) {
        if (subcategory?.id) {
            console.log("Updating subcategory", subcategory);
            const subcategorySnapshot = await get(ref(db, `subcategories/${subcategory?.id}`));
            if (subcategory?.isDeleted) {
                // Delete subcategory
                await update(ref(db, `subcategories/${subcategory?.id}`), {
                    deleted_on: new Date(),
                    deleted: true,
                    deleted_by: auth.currentUser.uid
                });
            } else {
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
                                category: id
                            });
                        });
                }
                
                // Update subcategory name if changed
                if (subcategory?.name !== subcategorySnapshot.val().name) {
                    await update(ref(db, `subcategories/${subcategory?.id}`), {
                        name: subcategory?.name
                    });
                }       
                
                if (subcategorySnapshot.val().deleted) {
                    await update(ref(db, `subcategories/${subcategory?.id}`), {
                        deleted_on: null,
                        deleted: false,
                        deleted_by: null
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
                        category: id
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

export const addFurniture = async (data) => {
    const { subcategory, name, description, image, price, model, height, width, length, texture, inventory } = data;

    try {
        const furnitureRef = ref(db, 'furniture');
        const newFurnitureRef = push(furnitureRef);
        const storageRef = sRef(storage, `furniture/${newFurnitureRef.key}`);
        let imageUrl;

        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);

        await set(ref(db, `furniture/${newFurnitureRef.key}`), {
            subcategory: subcategory,
            name: name,
            description: description,
            image: imageUrl,
            price: price,
            height: height,
            width: width,
            length: length,
            texture: texture,
            inventory: inventory
        });

        // update subcategory with furniture id
        const subcategoryRef = ref(db, `subcategories/${subcategory}`);
        const subcategorySnapshot = await get(subcategoryRef);
        const furnitureIds = subcategorySnapshot.val().furniture || [];
        furnitureIds.push(newFurnitureRef.key);
        await update(subcategoryRef, {
            furniture: furnitureIds
        });

        if (model) {
            const modelRef = sRef(storage, `3dModels/${newFurnitureRef.key}`);
            await uploadBytes(modelRef, model);
            const modelUrl = await getDownloadURL(modelRef);
            await update(ref(db, `furniture/${newFurnitureRef.key}`), {
                model: modelUrl
            });
        }

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export const updateFurniture = async (data) => {
    const { id, subcategory, name, description, image, price, model, height, width, length, texture, discount, inventory } = data;

    try {
        const furnitureRef = ref(db, `furniture/${id}`);
        const furnitureSnapshot = await get(furnitureRef);
        const imageUrl = furnitureSnapshot.val().image;
        const modelUrl = furnitureSnapshot.val().model;
        const currentSubcategory = furnitureSnapshot.val().subcategory;
        if (image !== imageUrl) {
            const storageRef = sRef(storage, `furniture/${id}`);
            await uploadBytes(storageRef, image);
            const newImageUrl = await getDownloadURL(storageRef);
            await update(furnitureRef, {
                name: name,
                description: description,
                image: newImageUrl,
                subcategory: subcategory,
                price: price,
                height: height,
                width: width,
                length: length,
                texture: texture,
                discount: discount,
                inventory: inventory
            });
        } else {
            await update(furnitureRef, {
                name: name,
                description: description,
                price: price,
                height: height,
                subcategory: subcategory,
                width: width,
                length: length,
                texture: texture,
                discount: discount,
                inventory: inventory
            });
        }

        if (currentSubcategory !== subcategory) {
            // update subcategory with furniture id
            const subcategoryRef = ref(db, `subcategories/${subcategory}`); 
            const subcategorySnapshot = await get(subcategoryRef);
            const furnitureIds = subcategorySnapshot.val().furniture || [];
            furnitureIds.push(id);
            await update(subcategoryRef, {
                furniture: furnitureIds
            });

            // remove furniture id from old subcategory
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

        if (modelUrl && model) {
            if (model !== modelUrl) {
                const modelRef = sRef(storage, `3dModels/${id}`);
                await uploadBytes(modelRef, model);
                const newModelUrl = await getDownloadURL(modelRef);
                await update(furnitureRef, {
                    model: newModelUrl
                });
            }            
        } else if (model) {
            const modelRef = sRef(storage, `3dModels/${id}`);
            await uploadBytes(modelRef, model);
            const newModelUrl = await getDownloadURL(modelRef);
            await update(furnitureRef, {
                model: newModelUrl
            });
        }

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
