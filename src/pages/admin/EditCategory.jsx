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
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
    Divider,
    Badge,
    Spinner,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill } from "react-icons/bs";
import { IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline } from "react-icons/io5";
import { MdOutlineSell, MdOutlineInventory } from "react-icons/md";
import { FaPlus, FaTrash  } from "react-icons/fa6";
import { TiTickOutline, TiTick } from "react-icons/ti";
import { CgUnavailable } from "react-icons/cg";
import { RiArrowGoBackFill } from "react-icons/ri";
import { useForm } from "react-hook-form";
import { db } from "../../../api/firebase";
import { updateCategoryAndSubcategories } from "../../../api/admin";
import { useParams } from "react-router-dom";
import { onValue, ref, query, orderByChild, equalTo, set } from "firebase/database";

function EditCategory() {
    const {
        handleSubmit,
        register,
        setValue,
        formState: {
            errors, isSubmitting
        }
    } = useForm();
    const {id} = useParams();
    const [category, setCategory] = useState(null);
    const [categoryNames, setCategoryNames] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [furniture, setFurniture] = useState([]);
    const [inventorySums, setInventorySums] = useState({});
    const [salesSums, setSalesSums] = useState({});
    const [subcategoryNames, setSubcategoryNames] = useState([]);
    const [initialSubcategories, setInitialSubcategories] = useState([]);
    const [isDragActive, setIsDragActive] = useState(false);
	const [imageSrc, setImageSrc] = useState(null);
    const [image, setImage] = useState(null);
	
	const previewImageRef = useRef(null);
	const previewImageContainerRef = useRef(null);
    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();
    const { isOpen: isOpenRevertModal, onOpen: onOpenRevertModal, onClose: onCloseRevertModal } = useDisclosure();
    const [selectedSubcategoryForDelete, setSelectedSubcategoryForDelete] = useState(null);
    const [selectedSubcategoryForRevert, setSelectedSubcategoryForRevert] = useState(null);
    
    const handleOpenDeleteModal = (subcategoryId) => {
        setSelectedSubcategoryForDelete(subcategoryId);
        onOpenDeleteModal();
    };
    
    const handleOpenRevertModal = (subcategoryId) => {
        setSelectedSubcategoryForRevert(subcategoryId);
        onOpenRevertModal();
    };
    
    const handleCloseDeleteModal = () => {
        setSelectedSubcategoryForDelete(null);
        onCloseDeleteModal();
    };
    
    const handleCloseRevertModal = () => {
        setSelectedSubcategoryForRevert(null);
        onCloseRevertModal();
    };

    useEffect(() => {
        onValue(ref(db, `categories/${id}`), (snapshot) => {
            const category = {
                id: snapshot.key,
                ...snapshot.val()
            }
            setCategory(category);
            setValue('category_name', category?.name);
            setImageSrc(category?.image);
            setImage(category?.image);
        }
    )
    }, [id]);

    useEffect(() => {
        const subcategoryRef = query(ref(db, 'subcategories'), orderByChild('category'), equalTo(id));
        onValue(subcategoryRef, (snapshot) => {
            const subcategories = [];
            snapshot.forEach((childSnapshot) => {
                const data = {
                    id: childSnapshot.key,
                    isDeleted: childSnapshot.val().deleted,
                    ...childSnapshot.val()
                }
                subcategories.push(data);
            });
            setSubcategories(subcategories);
            setInitialSubcategories(subcategories);
        });
    }, [id]);

    useEffect(() => {
        const inventorySums = {};
        const salesSums = {};

        const validSubcategories = subcategories.filter(subcategory => subcategory.id);
    
        validSubcategories.forEach((subcategory, index) => {
            const furnitureRef = query(ref(db, 'furniture'), orderByChild('subcategory'), equalTo(subcategory.id));
            onValue(furnitureRef, (snapshot) => {
                let furniture = [];
                let totalInventory = 0; 
                let totalSales = 0;
                snapshot.forEach((childSnapshot) => {
                    const data = {
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    };
                    if (data.variants) {
                        Object.keys(data.variants).forEach(variantId => {
                            const variant = data.variants[variantId];
                            totalInventory += parseInt(variant.inventory);
                        });
                    }
                    totalSales += Number(data.sales);
                    furniture.push(data);
                });
    
                inventorySums[subcategory.id] = totalInventory;
                salesSums[subcategory.id] = totalSales;
    
                if (Object.keys(inventorySums).length === validSubcategories.length) {
                    setInventorySums(inventorySums);
                }
    
                if (Object.keys(salesSums).length === validSubcategories.length) {
                    setSalesSums(salesSums);
                }
            });
        });
    }, [subcategories]);

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

    const handleAddSubcategory = () => {
        setSubcategories([...subcategories, { name: "", image: null, imageSrc: null }]);
    };

    const handleRemoveSubcategory = (indexToRemove) => {
        const updatedSubcategories = subcategories.map((subcategory, index) => {
            if (index === indexToRemove) {

                if (subcategory?.id) {
                    if (subcategory?.isDeleted) {
                        return { ...subcategory, isDeleted: false };
                    } else {
                        return { ...subcategory, isDeleted: true };
                    }
                } else {
                    return null;
                }
            }
            return subcategory;
        }).filter(Boolean); 
    
        setSubcategories(updatedSubcategories);
        handleCloseDeleteModal();
        handleCloseRevertModal();
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
                setImage(file);
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
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true);
        // check if category name is empty
        if (!data.category_name) {
            toast({
                title: "Category name is required",
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true
            });
            return;
        }

        const categoryData = {
            category_name: data.category_name,
            category_image: image
        };
        const subcategoryData = subcategories.map((subcategory) => ({
            id: subcategory.id,
            name: subcategory.name,
            image: subcategory.image,
            isDeleted: subcategory.isDeleted
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
            await updateCategoryAndSubcategories(category.id, categoryData, subcategoryData);
            toast({
                title: "Category updated successfully",
                status: "success",
                position: "top",
                duration: 5000,
                isClosable: true
            });
        }
        catch (error) {
            toast({
                title: "An error occurred",
                description: error.message,
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true
            });
        } finally {
            setIsLoading(false);
        }
    }
    

    return (
        <Flex w="full" justifyContent="center" p={4}>
            {
                isLoading && (
                    <Flex
                        w="full"
                        h="100vh"
                        position="fixed"
                        top="0"
                        left="0"
                        bg="rgba(0, 0, 0, 0.4)"
                        zIndex="1000"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Spinner
                            thickness="4px"
                            speed="0.65s"
                            emptyColor="gray.200"
                            color="blue.500"
                            size="xl"
                        />
                    </Flex>
                )
            }
            <Box w="90%" h="auto" bg="white" boxShadow="md" p={10}>
                <Flex w="full" direction="column">
                    <Flex w="full" direction="row" justifyContent="space-between" mb={12}>
                        <Flex w="full" direction="row" alignContent="center" gap={4}>
                            <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                            <Text fontSize="2xl" fontWeight="700" color="#d69511">Edit Category</Text>
                        </Flex>
                        <Button colorScheme="blue" variant="solid" onClick={handleSubmit(onSubmit)}>Confirm & Submit</Button>
                    </Flex>

                    <form action="/api/edit-category" method="post" encType="multipart/form-data">
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
                                            defaultValue={category?.name || ""}
                                            {
                                                ...register("category_name", {
                                                    required: "Category name is required"
                                                })
                                            }
                                            placeholder="Kitchenware"
                                            rounded="xl"
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
                                {subcategories?.map((subcategory, index) => (
                                    <Flex key={index} gap={6} direction="column" w="full">
                                        <Flex h="full" w="full" direction="row" gap={6} alignItems="center">
                                            <Flex w="full" direction="column" gap={6}>
                                                <FormControl isInvalid={errors.subcategories && errors.subcategories[index]?.name}>
                                                    <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                        Subcategory {index+1} Name <Text as="span" color="red.500" fontWeight="bold">*</Text> &nbsp; &nbsp;
                                                        {subcategory?.id ? <Badge colorScheme="green">Existing</Badge> : <Badge colorScheme="red">New</Badge>}
                                                    </FormLabel>
                                                    <Input
                                                        variant="filled"
                                                        type="text"
                                                        value={subcategory?.name || ""}
                                                        onChange={(e) => handleChangeSubcategory(index, 'name', e.target.value)}
                                                        placeholder="Subcategory Name"
                                                        rounded="xl"
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
                                                        Subcategory {index+1} Image <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                                    </FormLabel>
                                                    <Box
                                                        onDragEnter={() => handleSubcategoryDragEnter(index)}
                                                        onDragOver={handleSubcategoryDragOver}
                                                        onDragLeave={() => handleSubcategoryDragLeave(index)}
                                                        onDrop={(e) => handleSubcategoryDrop(index, e)}
                                                        rounded="lg"
                                                        borderWidth="2px"
                                                        border={"dashed"}
                                                        borderColor={subcategory?.isDragging ? "blue.500" : "gray.300"}
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
                                                                color={subcategory?.isDragging ? "blue" : "gray"}
                                                            />
                                                            <Text mb={2} fontSize="sm" fontWeight="semibold">
                                                                {subcategory?.isDragging ? "Drop the file here" : "Drag & Drop or Click to upload"}
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
                                                bg={!subcategory?.image && !subcategory?.imageSrc ? "gray.200" : "transparent"}
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
                                                    src={subcategory?.imageSrc || subcategory?.image || ""}
                                                    alt={subcategory?.imageSrc || subcategory?.image ? "Preview" : ""}
                                                    display={(subcategory?.imageSrc || subcategory?.image) ? "block" : "none"}
                                                    style={{
                                                        height: "100%", 
                                                        objectFit: "contain", 
                                                        objectPosition: "center" 
                                                    }}
                                                />
                                            </Box>        

                                            { subcategory?.id ? (
                                                <Flex w="50%" direction="column">
                                                    { subcategory?.isDeleted ? (
                                                        <Box p={3}>
                                                            <Flex alignItems='center'>
                                                                <CgUnavailable color='red' size='35'/>
                                                                <Box ml={4}>
                                                                    <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Status</Text>
                                                                    <Text fontSize='md'>Deleted</Text>                                
                                                                </Box>
                                                            </Flex>
                                                        </Box>
                                                    ) : 
                                                        <Box p={3}>
                                                            <Flex alignItems='center'>
                                                                <TiTick color='green' size='35'/>
                                                                <Box ml={4}>
                                                                    <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Status</Text>
                                                                    <Text fontSize='md'>Available</Text>                                
                                                                </Box>
                                                            </Flex>
                                                        </Box>
                                                    }
                                                    <Box p={3}>
                                                        <Flex alignItems='center'>
                                                            <IoBedOutline color='#d69511' size='35'/>
                                                            <Box ml={4}>
                                                                <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>No. Of Furniture</Text>
                                                                <Text fontSize='md'>{subcategory?.furniture?.length || 0}</Text>                                
                                                            </Box>
                                                        </Flex>
                                                    </Box>
                                                    <Box p={3}>
                                                        <Flex alignItems='center'>
                                                            <MdOutlineSell color='#d69511' size='35'/>
                                                            <Box ml={4}>
                                                                <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Furniture Sales</Text>
                                                                <Text fontSize='md'>{salesSums[subcategory?.id] || 0} sold</Text>                                
                                                            </Box>
                                                        </Flex>
                                                    </Box>
                                                    <Box p={3}>
                                                        <Flex alignItems='center'>
                                                            <MdOutlineInventory color='#d69511' size='35'/>
                                                            <Box ml={4}>
                                                                <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Furniture Inventory</Text>
                                                                <Text fontSize='md'>{inventorySums[subcategory?.id] || 0} in stock</Text>                                
                                                            </Box>
                                                        </Flex>
                                                    </Box>
                                                </Flex>      
                                            ) : null}      

                                            <Divider h={"16rem"} orientation="vertical" borderWidth="1px" borderColor="gray.300"/>                                                                 

                                            <Flex h="auto" alignItems="center" justifyContent="center" gap={4} direction="column">
                                                {subcategory?.id ? (
                                                    subcategory?.isDeleted ? (
                                                        <Button colorScheme="blue" variant="solid" onClick={(e) => { e.preventDefault(); handleOpenRevertModal(index); }}><RiArrowGoBackFill size="20px"/></Button>
                                                    ) : (
                                                        <Button colorScheme="red" variant="solid" onClick={(e) => { e.preventDefault(); handleOpenDeleteModal(index); }}><FaTrash size="20px"/></Button>
                                                    )
                                                ) : (
                                                    <Button colorScheme="red" variant="solid" onClick={() => handleRemoveSubcategory(index)}><FaTrash size="20px"/></Button>
                                                )}

                                                {index === subcategories.length - 1 ? (
                                                    <Button colorScheme="green" variant="solid" onClick={handleAddSubcategory}><FaPlus size="20px"/></Button>
                                                ) : null}
                                            </Flex>
                                            { isOpenDeleteModal && selectedSubcategoryForDelete === index && (
                                                <Modal size='xl' isCentered isOpen={isOpenDeleteModal} onClose={handleCloseDeleteModal}>
                                                    <ModalOverlay
                                                        bg='blackAlpha.300'
                                                    />
                                                    <ModalContent>
                                                        <ModalHeader>Confirmation For Deleting Subcategory</ModalHeader>
                                                        <ModalCloseButton _focus={{
                                                            boxShadow: 'none',
                                                            outline: 'none',
                                                        }} />
                                                        <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300"/>
                                                        <ModalBody>
                                                            <Text fontSize='md' letterSpacing='wide' fontWeight='bold' mb={2}>
                                                                Confirm Deletion Of {subcategory?.name}?
                                                            </Text>
                                                            <Text mb={2} textAlign="justify">
                                                                Approving deletion of {subcategory?.name} will officially remove the subcategory in the system. Furnitures
                                                                associated with this subcategory will be unavailable after deletion.
                                                            </Text>
                                                        </ModalBody>
                                                        <ModalFooter>
                                                            <Box display='flex'>
                                                                <Button mr={3} colorScheme="red" onClick={(e) => {handleRemoveSubcategory(index); }}>Confirm</Button>
                                                                <Button colorScheme="blue" onClick={handleCloseDeleteModal}>Close</Button>
                                                            </Box>
                                                        </ModalFooter>
                                                    </ModalContent>
                                                </Modal>                                                  
                                            )}

                                            { isOpenRevertModal && selectedSubcategoryForRevert === index && (
                                                <Modal size='xl' isCentered isOpen={isOpenRevertModal} onClose={handleCloseRevertModal}>
                                                    <ModalOverlay
                                                        bg='blackAlpha.300'
                                                    />
                                                    <ModalContent>
                                                        <ModalHeader>Confirmation For Restoring Subcategory</ModalHeader>
                                                        <ModalCloseButton _focus={{
                                                            boxShadow: 'none',
                                                            outline: 'none',
                                                        }} />
                                                        <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300"/>
                                                        <ModalBody>
                                                            <Text fontSize='md' letterSpacing='wide' fontWeight='bold' mb={2}>
                                                                Confirm Restoration Of {subcategory?.name}?
                                                            </Text>
                                                            <Text mb={2} textAlign="justify">
                                                                Approving restoration of {subcategory?.name} will officially add the removed subcategory in the system. Furnitures
                                                                associated with this subcategory will be available after restoration.
                                                            </Text>
                                                        </ModalBody>
                                                        <ModalFooter>
                                                            <Box display='flex'>
                                                                <Button mr={3} colorScheme="red" onClick={(e) => {handleRemoveSubcategory(index); }}>Confirm</Button>
                                                                <Button colorScheme="blue" onClick={handleCloseRevertModal}>Close</Button>
                                                            </Box>
                                                        </ModalFooter>
                                                    </ModalContent>
                                                </Modal>    
                                            )}
                                          
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

export default EditCategory;