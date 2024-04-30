import {
	Text,
    Flex,
    Box,
    Button,
    Input,
    FormControl,
    FormLabel,
    FormErrorMessage,
    useToast,
    Divider,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill } from "react-icons/bs";
import { IoMdArrowRoundBack } from "react-icons/io";
import { FaPlus, FaTrash  } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { createCategoryAndSubcategories } from "../../../api/admin";
import { db } from "../../../api/firebase";
import { onValue, ref, query, orderByChild, equalTo, set } from "firebase/database";

function AddCategory() {
    const {
        handleSubmit,
        register,
        formState: {
            errors, isSubmitting
        }
    } = useForm();

    const initialSubcategory = { name: '', imageSrc: '', isDragging: false };

    const [subcategories, setSubcategories] = useState([initialSubcategory]);
    const [categoryNames, setCategoryNames] = useState([]);
    const [subcategoryNames, setSubcategoryNames] = useState([]);

    const handleAddSubcategory = () => {
        setSubcategories([...subcategories, { ...initialSubcategory }]);
    };

    const handleRemoveSubcategory = (indexToRemove) => {
        if (subcategories.length > 1) {
            setSubcategories(subcategories.filter((_, index) => index !== indexToRemove));
        }
    };

    const handleChangeSubcategory = (index, field, value) => {
        const updatedSubcategories = [...subcategories];
        updatedSubcategories[index][field] = value;
        setSubcategories(updatedSubcategories);
    };

    const handleSubcategoryFileInputChange = (index, event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                handleChangeSubcategory(index, 'imageSrc', reader.result);
                handleChangeSubcategory(index, 'image', file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubcategoryDragEnter = (index) => {
        const updatedSubcategories = [...subcategories];
        updatedSubcategories[index].isDragging = true;
        setSubcategories(updatedSubcategories);
    };

    const handleSubcategoryDragOver = (event) => {
        event.preventDefault();
    };

    const handleSubcategoryDragLeave = (index) => {
        const updatedSubcategories = [...subcategories];
        updatedSubcategories[index].isDragging = false;
        setSubcategories(updatedSubcategories);
    };

    const handleSubcategoryDrop = (index, event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                handleChangeSubcategory(index, 'imageSrc', reader.result);
                handleChangeSubcategory(index, 'image', file);
            };
            reader.readAsDataURL(file);
        }
        const updatedSubcategories = [...subcategories];
        updatedSubcategories[index].isDragging = false;
        setSubcategories(updatedSubcategories);
    };

    const [isDragActive, setIsDragActive] = useState(false);
	const [imageSrc, setImageSrc] = useState(null);
    const [image, setImage] = useState(null);
	
	const previewImageRef = useRef(null);
	const previewImageContainerRef = useRef(null);

    const handleDragEnter = (e) => {
		e.preventDefault();
		setIsDragActive(true);
	};
	
	const handleDragOver = (e) => {
		e.preventDefault();
		setIsDragActive(true);
	};
	
	const handleDragLeave = () => {
		setIsDragActive(false);
	};
	
    const populatePreviewImage = (file) => {
		if (file) {
			if (isImageFile(file)) {
				// Read the file and set the image source
				const reader = new FileReader();
				reader.onload = (event) => {
					setImageSrc(reader.result);
				};
				reader.readAsDataURL(file);
			} else {
				alert("Invalid file type. Please upload an image.");
			}
		} else {
			console.log("No file");
		}
	}
	
	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragActive(false);
		const file = e.dataTransfer.files[0];
		populatePreviewImage(file);
	};
	
	const handleFileInputChange = (e) => {
		const file = e.target.files[0];
        setImage(file);
		populatePreviewImage(file);
	};
	
	const isImageFile = (file) => {
		return file.type.startsWith("image/");
	};

    const toast = useToast();

    useEffect(() => {
        const categoryRef = ref(db, 'categories');
        onValue(categoryRef, (snapshot) => {
            const categories = [];
            snapshot.forEach((childSnapshot) => {
                const categoryName = childSnapshot.val().name.toLowerCase().replace(/\s+/g, '_');
                const categoryId = childSnapshot.key;
                categories.push({ id: categoryId, name: categoryName });
            });
            setCategoryNames(categories);
        });
    
        const subcategoryRef = ref(db, 'subcategories');
        onValue(subcategoryRef, (snapshot) => {
            const subcategories = [];
            snapshot.forEach((childSnapshot) => {
                const subcategoryName = childSnapshot.val().name.toLowerCase().replace(/\s+/g, '_');
                const subcategoryId = childSnapshot.key;
                subcategories.push({ id: subcategoryId, name: subcategoryName });
            });
            setSubcategoryNames(subcategories);
        });
    }, []);
    
    function checkConflictingNames(type, name, id) {
        name = name.toLowerCase().replace(/\s+/g, '_');
        if (type === 'category') {
            return categoryNames.some(category => category.name === name && category.id !== id);
        } else if (type === 'subcategory') {
            return subcategoryNames.some(subcategory => subcategory.name === name && subcategory.id !== id);
        }
    }

    const onSubmit = async (data) => {
        const categoryData = {
            category_name: data.category_name,
            category_image: image,
        };
    
        const subcategoryData = subcategories.map((subcategory) => ({
            name: subcategory.name,
            image: subcategory.image,
        }));

        if (checkConflictingNames('category', data.category_name, id)) {
            toast({
                title: "Category name already exists",
                description: "Please use a different name",
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true
            });
            return;
        }   

        const conflictingSubcategoryNames = subcategoryData.filter((subcategory, index) => {
            return checkConflictingNames('subcategory', subcategory.name, subcategory.id);
        });

        if (conflictingSubcategoryNames.length > 0) {
            toast({
                title: "Subcategory name already exists",
                description: "Please use a different name",
                status: "error",
                position: "top",    
                duration: 5000,
                isClosable: true
            });
            return;
        }
    
        // Check if category image exists
        if (!categoryData.category_image) {
            toast({
                title: "Error creating category and subcategories",
                description: "Category image is required",
                status: "error",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
            return;
        }
    
        // Check if all subcategory images exist
        const missingSubcategoryImages = subcategoryData.filter((subcategory) => !subcategory.image);
        if (missingSubcategoryImages.length > 0) {
            toast({
                title: "Error creating category and subcategories",
                description: "All subcategory images are required",
                status: "error",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
            return;
        }

        // Check if all subcategory names are filled
        const missingSubcategoryNames = subcategoryData.filter((subcategory) => !subcategory.name);
        if (missingSubcategoryNames.length > 0) {
            toast({
                title: "Error creating category and subcategories",
                description: "All subcategory names are required",
                status: "error",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
            return;
        }
    
        try {
            await createCategoryAndSubcategories(categoryData, subcategoryData);
            toast({
                title: "Category and subcategories created successfully!",
                status: "success",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error creating category and subcategories",
                description: error.message,
                status: "error",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
        }
    }
    

    return (
        <Flex w="full" justifyContent="center" p={4}>
            <Box w="90%" h="auto" bg="white" boxShadow="md" p={10}>
                <Flex w="full" direction="column">
                    <Flex w="full" direction="row" justifyContent="space-between" mb={12}>
                        <Flex w="full" direction="row" alignContent="center" gap={4}>
                            <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                            <Text fontSize="2xl" fontWeight="700" color="#d69511">Add New Category</Text>
                        </Flex>
                        <Button colorScheme="blue" variant="solid" onClick={handleSubmit(onSubmit)}>Confirm & Submit</Button>
                    </Flex>

                    <form action="/api/add-category" method="post" encType="multipart/form-data">
                        <Flex w="full" direction="column" gap={6}>
                            <Flex w="full" direction="row" gap={6}>
                                <Flex w="full" direction="column" gap={6}>
                                    <FormControl isInvalid={errors.category_name}>
                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                            Category Name <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                        </FormLabel>
                                        <Input
                                            variant="filled"
                                            type="text"
                                            id="category_name"
                                            {
                                                ...register("category_name", {
                                                    required: "Category name cannot be empty",
                                                })
                                            }
                                            placeholder="Kitchenware"
                                            rounded="md"
                                            borderWidth="1px"
                                            borderColor="gray.300"
                                            color="gray.900"
                                            size="md"
                                            focusBorderColor="blue.500"
                                            w="full"
                                            p={2.5}
                                        />
                                        <FormErrorMessage>
                                            {errors.category_name && errors.category_name.message}
                                        </FormErrorMessage>
                                    </FormControl>            
                                    <FormControl>
                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                            Category Image <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                        </FormLabel>
                                        <Box
                                            onDragEnter={handleDragEnter}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            rounded="lg"
                                            borderWidth="2px"
                                            border={"dashed"}
                                            borderColor={isDragActive ? "blue.500" : "gray.300"}
                                            p={8}
                                            textAlign="center"
                                            position={"relative"}
                                            cursor="pointer"
                                        >
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                opacity={0}
                                                width="100%"
                                                height="100%"
                                                id="category_image"
                                                position="absolute"
                                                top={0}
                                                left={0}
                                                zIndex={1}
                                                cursor="pointer"
                                                isRequired
                                                onChange={handleFileInputChange}
                                            />
                                            <Flex direction="column" alignItems="center">
                                                <BsFillCloudArrowDownFill
                                                    onDragEnter={handleDragEnter}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    size={32}
                                                    color={isDragActive ? "blue" : "gray"}
                                                />
                                                <Text mb={2} fontSize="sm" fontWeight="semibold">
                                                    {isDragActive ? "Drop the file here" : "Drag & Drop or Click to upload"}
                                                </Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    (SVG, PNG, JPG, or JPEG)
                                                </Text>
                                            </Flex>
                                        </Box>
                                    </FormControl>                    
                                </Flex>    
                                <Box
                                    w="full"
                                    h="280px"
                                    id="preview-image-container"
                                    bg={!imageSrc ? "gray.200" : "transparent"}
                                    rounded="lg"
                                    display="flex"
                                    flexDir="column"
                                    alignItems="center"
                                    justifyContent="center"
                                    mt={4}
                                    overflow="hidden"
                                    ref={previewImageContainerRef}
                                >
                                    <img
                                        id="preview-image"
                                        src={imageSrc || ""}
                                        alt={imageSrc ? "Preview" : ""}
                                        display={imageSrc ? "block" : "none"}
                                        ref={previewImageRef}
                                        style={{ 
                                            height: "100%", 
                                            objectFit: "contain", 
                                            objectPosition: "center" 
                                        }}
                                    />
                                </Box>                            
                            </Flex>
                            
                            <Text mt={3} fontSize="2xl" fontWeight="700" color="#d69511">Subcategory</Text>

                            <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  

                            <Flex w="full" direction="column" gap={6}>
                                {subcategories.map((subcategory, index) => (
                                    <Flex key={index} gap={6} direction="column" w="full">
                                        <Flex h="full" w="full" direction="row" gap={6} >
                                            <Flex w="full" direction="column" gap={6}>
                                                <FormControl isInvalid={errors.subcategories && errors.subcategories[index]?.name}>
                                                    <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                        Subcategory {index+1} Name
                                                    </FormLabel>
                                                    <Input
                                                        variant="filled"
                                                        type="text"
                                                        value={subcategory.name}
                                                        onChange={(e) => handleChangeSubcategory(index, 'name', e.target.value)}
                                                        placeholder="Subcategory Name"
                                                        rounded="md"
                                                        id={`subcategory_name_${index}`}
                                                        borderWidth="1px"
                                                        borderColor="gray.300"
                                                        color="gray.900"
                                                        size="md"
                                                        focusBorderColor="blue.500"
                                                        w="full"
                                                        p={2.5}
                                                    />

                                                    <FormErrorMessage>
                                                        {errors.subcategories && errors.subcategories[index]?.name && errors.subcategories[index]?.name.message}
                                                    </FormErrorMessage>
                                                </FormControl>         

                                                <FormControl>
                                                    <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                        Subcategory {index+1} Image
                                                    </FormLabel>
                                                    <Box
                                                        onDragEnter={() => handleSubcategoryDragEnter(index)}
                                                        onDragOver={handleSubcategoryDragOver}
                                                        onDragLeave={() => handleSubcategoryDragLeave(index)}
                                                        onDrop={(e) => handleSubcategoryDrop(index, e)}
                                                        rounded="lg"
                                                        borderWidth="2px"
                                                        border={"dashed"}
                                                        borderColor={subcategory.isDragging ? "blue.500" : "gray.300"}
                                                        p={8}
                                                        textAlign="center"
                                                        position={"relative"}
                                                        cursor="pointer"
                                                    >
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            opacity={0}
                                                            width="100%"
                                                            height="100%"
                                                            position="absolute"
                                                            top={0}
                                                            left={0}
                                                            zIndex={1}
                                                            cursor="pointer"
                                                            isRequired
                                                            onChange={(e) => handleSubcategoryFileInputChange(index, e)}
                                                        />
                                                        <Flex direction="column" alignItems="center">
                                                            <BsFillCloudArrowDownFill
                                                                onDragEnter={() => handleSubcategoryDragEnter(index)}
                                                                onDragOver={handleSubcategoryDragOver}
                                                                onDragLeave={() => handleSubcategoryDragLeave(index)}
                                                                onDrop={(e) => handleSubcategoryDrop(index, e)}
                                                                size={32}
                                                                color={subcategory.isDragging ? "blue" : "gray"}
                                                            />
                                                            <Text mb={2} fontSize="sm" fontWeight="semibold">
                                                                {subcategory.isDragging ? "Drop the file here" : "Drag & Drop or Click to upload"}
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500">
                                                                (SVG, PNG, JPG, or JPEG)
                                                            </Text>
                                                        </Flex>
                                                    </Box>
                                                </FormControl>  
                                            </Flex>
                                            <Box
                                                w="full"
                                                h="280px"
                                                id={`preview-image-container-${index}`}
                                                bg={!subcategory.imageSrc ? "gray.200" : "transparent"}
                                                rounded="lg"
                                                display="flex"
                                                flexDir="column"
                                                alignItems="center"
                                                justifyContent="center"
                                                mt={4}
                                                overflow="hidden" 
                                            >
                                                <img
                                                    id={`preview-image-${index}`}
                                                    src={subcategory.imageSrc || ""}
                                                    alt={subcategory.imageSrc ? "Preview" : ""}
                                                    display={subcategory.imageSrc ? "block" : "none"}
                                                    style={{
                                                        height: "100%", 
                                                        objectFit: "contain", 
                                                        objectPosition: "center" 
                                                    }}
                                                />
                                            </Box>   
                                            <Divider h={"16rem"} orientation="vertical" borderWidth="1px" borderColor="gray.300"/>   
                                            <Flex h="auto" alignItems="center" justifyContent="center" gap={4} direction="column">
                                                {index > 0 && (
                                                    <Button colorScheme="red" variant="solid" onClick={() => handleRemoveSubcategory(index)}><FaTrash size="20px"/></Button>
                                                )}
                                                {index === subcategories.length - 1 ? (
                                                    <Button colorScheme="green" variant="solid" onClick={handleAddSubcategory}><FaPlus size="20px"/></Button>
                                                ) : null}
                                            </Flex>
                                        </Flex>
                                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                    </Flex>
                                ))}
                            </Flex>
                        </Flex>
                    </form>
                </Flex>
            </Box>
        </Flex>
    );
}

export default AddCategory;