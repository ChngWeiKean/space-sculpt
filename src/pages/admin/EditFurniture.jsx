import {
	Text,
    Flex,
    Box,
    Button,
    Input,
    FormControl,
    FormLabel,
    FormErrorMessage,
    InputLeftAddon,
    InputRightAddon,
    Textarea,
    useToast,
    Divider,
    InputGroup,
    Spinner,
    Select,
    useDisclosure,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    AlertIcon,
    Alert,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { BsFillCloudArrowDownFill } from "react-icons/bs";
import { RxHeight, RxWidth, RxSize } from "react-icons/rx";
import { IoIosHeart, IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline, IoColorPaletteOutline } from "react-icons/io5";
import { RiArrowGoBackFill } from "react-icons/ri";
import { FaPlus, FaTrash, FaStar, FaStarHalf } from "react-icons/fa6";
import { MdOutlineInventory, MdOutlineTexture } from "react-icons/md";
import { useForm } from "react-hook-form";
import { useParams } from 'react-router-dom';
import { db } from "../../../api/firebase";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { onValue, ref } from "firebase/database";
import { updateFurniture } from "../../../api/admin";

function EditFurniture() {
    const { id } = useParams();
    const [ furniture, setFurniture ] = useState(null);
    const [ subcategory, setSubcategory ] = useState(null);
    const [ subcategories, setSubcategories ] = useState([]);
    const [ filterInventory, setFilterInventory ] = useState("");
    const [ category, setCategory ] = useState(null);
    const [ lowInventory, setLowInventory ] = useState([]);
    const [ outOfStock, setOutOfStock ] = useState([]);
    const {
        handleSubmit,
        register,
        setValue,
        formState: {
            errors
        }
    } = useForm();

    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();
    const { isOpen: isOpenRevertModal, onOpen: onOpenRevertModal, onClose: onCloseRevertModal } = useDisclosure();
    const [selectedVariantForDelete, setSelectedVariantForDelete] = useState(null);
    const [selectedVariantForRevert, setSelectedVariantForRevert] = useState(null);
    
    const handleOpenDeleteModal = (variantId) => {
        setSelectedVariantForDelete(variantId);
        onOpenDeleteModal();
    };
    
    const handleOpenRevertModal = (variantId) => {
        setSelectedVariantForRevert(variantId);
        onOpenRevertModal();
    };
    
    const handleCloseDeleteModal = () => {
        setSelectedVariantForDelete(null);
        onCloseDeleteModal();
    };
    
    const handleCloseRevertModal = () => {
        setSelectedVariantForRevert(null);
        onCloseRevertModal();
    };

    const [variants, setVariants] = useState([]);

    const handleAddVariant = () => {
        setVariants([...variants, { color: '', inventory: 0, image: '', imageSrc: '', model: '', modelSrc: '', icon: '', iconSrc: '', isDraggingImage: false, isDraggingModel: false, isDraggingIcon: false }]);
    };

    const handleRemoveVariant = (indexToRemove) => {
        const updatedVariants = variants.map((variant, index) => {
            if (index === indexToRemove) {

                if (variant?.id) {
                    if (variant?.isDeleted) {
                        return { ...variant, isDeleted: false };
                    } else {
                        return { ...variant, isDeleted: true };
                    }
                } else {
                    return null;
                }
            }
            return variant;
        }).filter(Boolean); 
    
        setVariants(updatedVariants);
        handleCloseDeleteModal();
        handleCloseRevertModal();
    };

    const handleChangeVariant = (index, field, value) => {
        const updatedVariant = [...variants];
        updatedVariant[index][field] = value;
        setVariants(updatedVariant);
    };

    const handleVariantImageInputChange = (index, event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                handleChangeVariant(index, 'imageSrc', reader.result);
                handleChangeVariant(index, 'image', file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVariantImageDragEnter = (index) => {
        const updatedVariant = [...variants];
        updatedVariant[index].isDraggingImage = true;
        setVariants(updatedVariant);
    };

    const handleVariantImageDragOver = (event) => {
        event.preventDefault();
    };

    const handleVariantImageDragLeave = (index) => {
        const updatedVariant = [...variants];
        updatedVariant[index].isDraggingImage = false;
        setVariants(updatedVariant);
    };

    const handleVariantImageDrop = (index, event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                handleChangeVariant(index, 'imageSrc', reader.result);
                handleChangeVariant(index, 'image', file);
            };
            reader.readAsDataURL(file);
        }
        const updatedVariant = [...variants];
        updatedVariant[index].isDraggingImage = false;
        setVariants(updatedVariant);
    };

    const handleVariantIconInputChange = (index, event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                handleChangeVariant(index, 'iconSrc', reader.result);
                handleChangeVariant(index, 'icon', file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVariantIconDragEnter = (index) => {
        const updatedVariant = [...variants];
        updatedVariant[index].isDraggingIcon = true;
        setVariants(updatedVariant);
    };

    const handleVariantIconDragOver = (event) => {
        event.preventDefault();
    };

    const handleVariantIconDragLeave = (index) => {
        const updatedVariant = [...variants];
        updatedVariant[index].isDraggingIcon = false;
        setVariants(updatedVariant);
    };

    const handleVariantIconDrop = (index, event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                handleChangeVariant(index, 'iconSrc', reader.result);
                handleChangeVariant(index, 'icon', file);
            };
            reader.readAsDataURL(file);
        }
        const updatedVariant = [...variants];
        updatedVariant[index].isDraggingIcon = false;
        setVariants(updatedVariant);
    };

    const handleVariantModelInputChange = (index, event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                handleChangeVariant(index, 'modelSrc', reader.result);
                handleChangeVariant(index, 'model', file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVariantModelDragEnter = (index) => {
        const updatedVariant = [...variants];
        updatedVariant[index].isDraggingModel = true;
        setVariants(updatedVariant);
    };

    const handleVariantModelDragOver = (event) => {
        event.preventDefault();
    };

    const handleVariantModelDragLeave = (index) => {
        const updatedVariant = [...variants];
        updatedVariant[index].isDraggingModel = false;
        setVariants(updatedVariant);
    };

    const handleVariantModelDrop = (index, event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                handleChangeVariant(index, 'modelSrc', reader.result);
                handleChangeVariant(index, 'model', file);
            };
            reader.readAsDataURL(file);
        }
        const updatedVariant = [...variants];
        updatedVariant[index].isDraggingModel = false;
        setVariants(updatedVariant);
    };

    const ModelPreview = ({ model }) => {
        const [isLoading, setLoading] = useState(true);
        const containerRef = useRef(null);
        let requestAnimationId = null;
    
        useEffect(() => {
            if (!model) return;
    
            let scene = new THREE.Scene();
            let camera = new THREE.PerspectiveCamera(35, containerRef.current.offsetWidth / containerRef.current.offsetHeight, 0.1, 1000);
            let renderer = new THREE.WebGLRenderer();
            let controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.25;
            controls.enableZoom = true;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.5;
            controls.enablePan = true;
            controls.enableKeys = true;
            controls.keys = {
                LEFT: 37, //left arrow
                UP: 38, // up arrow
                RIGHT: 39, // right arrow
                BOTTOM: 40 // down arrow
            };
            controls.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };
            controls.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };
            controls.update();
    
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setClearColor(0x000000, 0);
            renderer.setSize(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
            containerRef.current.appendChild(renderer.domElement);
    
            // Add lighting to the scene
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // soft white light
            scene.add(ambientLight);
    
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // strong white light
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);
    
            const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5); // softer white light from the opposite side
            directionalLight2.position.set(-5, -5, -5);
            scene.add(directionalLight2);
    
            let loader = new GLTFLoader();
    
            loader.load(
                model,
                (object) => {
                    scene.add(object.scene || object); 
                    setLoading(false);
                },
                (xhr) => {
                    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
                },
                (error) => {
                    setLoading(false);
                }
            );
    
            camera.position.z = 3;
    
            const animate = () => {
                requestAnimationId = requestAnimationFrame(animate);
                renderer.render(scene, camera);
            };
            animate();
    
            function sceneTraverse(obj, fn) {
                if (!obj) return;
                fn(obj);
                if (obj.children && obj.children.length > 0) {
                    obj.children.forEach(o => {
                        sceneTraverse(o, fn);
                    });
                }
            }
    
            function dispose() {
                // Dispose of geometries and materials in the scene
                sceneTraverse(scene, o => {
                    if (o.geometry) {
                        o.geometry.dispose();
                    }
                    if (o.material) {
                        if (Array.isArray(o.material)) {
                            o.material.forEach(mat => mat.dispose());
                        } else {
                            o.material.dispose();
                        }
                    }
                });
                renderer && renderer.renderLists.dispose();
                renderer && renderer.dispose();
                controls.dispose();
                renderer.domElement.parentElement.removeChild(renderer.domElement);
                scene = null;
                camera = null;
                renderer = null;
            }
    
            return () => {
                if (requestAnimationId) {
                    cancelAnimationFrame(requestAnimationId);
                }
                requestAnimationId = null;
                dispose();
            };
        }, [model]);
    
        return (
            <Box ref={containerRef} h={"245px"} w={"350px"} position="relative">
                {isLoading && (
                    <Spinner
                        thickness="4px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="blue.500"
                        size="xl"
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                    />
                )}
            </Box>
        );
    };    
    
    useEffect(() => {
        const furnitureRef = ref(db, `furniture/${id}`);
        onValue(furnitureRef, (furnitureSnapshot) => {
            let ratings = 0;
            if (furnitureSnapshot.val().reviews) {
                ratings = Object.values(furnitureSnapshot.val().reviews).reduce((acc, review) => acc + review.rating, 0) / Object.values(furnitureSnapshot.val().reviews).length;
            } else {
                ratings = 0;
            }
            let data = {
                id: furnitureSnapshot.key,
                ratings: ratings,
                ...furnitureSnapshot.val()
            }
            setFurniture(data);
            const variantsArray = Object.entries(furnitureSnapshot.val().variants).map(([key, value]) => ({
                id: key,
                isDeleted: value.deleted,
                ...value
            }));
            setVariants(variantsArray);
            const subcategoryRef = ref(db, `subcategories/${furnitureSnapshot.val().subcategory}`);
            onValue(subcategoryRef, (subcategorySnapshot) => {
                let data = {
                    id: subcategorySnapshot.key,
                    ...subcategorySnapshot.val()
                }
                setSubcategory(data);
                const categoryRef = ref(db, `categories/${subcategorySnapshot.val().category}`);
                let subcategoryIds = [];
                onValue(categoryRef, (categorySnapshot) => {
                    setCategory(categorySnapshot.val());
                    categorySnapshot.val().subcategories.forEach((subcategory) => {
                        subcategoryIds.push(subcategory);
                        console.log(subcategoryIds);
                    });
                    const subcategoryQuery = ref(db, `subcategories`);
                    onValue(subcategoryQuery, (snapshot) => {
                        let subcategories = [];
                        snapshot.forEach((childSnapshot) => {
                            if (subcategoryIds.includes(childSnapshot.key)) {
                                let data = {
                                    id: childSnapshot.key,
                                    ...childSnapshot.val()
                                }
                                subcategories.push(data);
                            }
                        });
                        setSubcategories(subcategories);
                    });
                });

            });            
        });

    }, [ id ]);

    useEffect(() => {
        const lowInventory = variants.filter((variant) => variant.inventory < 10 && variant.inventory > 0).map((variant) => variant.color);
        setLowInventory(lowInventory);
        const outOfStock = variants.filter((variant) => variant.inventory == 0).map((variant) => variant.color);
        setOutOfStock(outOfStock);
    }, [ variants ]);

    useEffect(() => {
        if (furniture) {
            setValue("name", furniture?.name);
            setValue("material", furniture?.material);
            setValue("height", furniture?.height);
            setValue("width", furniture?.width);
            setValue("length", furniture?.length);
            setValue("price", furniture?.price);
            setValue("weight", furniture?.weight);
            setValue("discount", furniture?.discount || 0);
            setValue("description", furniture?.description);
            setValue("cost", furniture?.cost);
            setValue("care_method", furniture?.care_method);
        }

        if (variants) {
            variants.forEach((variant, index) => {
                setValue(`variants[${index}].color`, variant?.color);
                setValue(`variants[${index}].inventory`, variant?.inventory);
            });
        }

        if (subcategory) {
            setValue("subcategory", subcategory?.id);
        }

        if (category) {
            setValue("category", category?.name);
        }
    }, [ furniture, subcategory, category, variants ]);

    const toast = useToast();
    const [isLoading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        const furnitureData = {
            id: id,
            ...data,
        };

        const furnitureVariants = variants.map((variant) => ({
            id: variant.id,
            color: variant.color,
            inventory: variant.inventory,
            image: variant.image,
            icon: variant.icon,
            model: variant.model,
            isDeleted: variant.isDeleted
        }));

        console.log(furnitureData);
        console.log(furnitureVariants);

        if (furnitureData.height < 0 || furnitureData.width < 0 || furnitureData.length < 0 || furnitureData.price < 0 || furnitureData.weight < 0 || furnitureData.cost < 0) {
            toast({
                title: "Error creating furniture",
                description: "Please make sure that all number fields are positive",
                status: "error",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        for (let i = 0; i < furnitureVariants.length; i++) {
            if (furnitureVariants[i].inventory < 0) {
                toast({
                    title: "Error creating furniture",
                    description: "Please make sure that all variant inventory are positive",
                    status: "error",
                    duration: 3000,
                    position: "top",
                    isClosable: true,
                });
                setLoading(false);
                return;
            }
        }

        if (furnitureData.discount < 0 || furnitureData.discount > 100) {
            toast({
                title: "Error creating furniture",
                description: "Please make sure that the discount is between 0 and 100",
                status: "error",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        for (let i = 0; i < furnitureVariants.length; i++) {
            if (furnitureVariants[i].color === '' || furnitureVariants[i].image === '' || furnitureVariants[i].model === '' || furnitureVariants[i].icon === '') {
                toast({
                    title: "Error creating furniture",
                    description: "Please make sure that all variant fields are filled",
                    status: "error",
                    duration: 3000,
                    position: "top",
                    isClosable: true,
                });
                setLoading(false);
                return;
            }
        }

        try {
            await updateFurniture(furnitureData, furnitureVariants);
            toast({
                title: "Furniture updated successfully!",
                status: "success",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
            window.history.back();
        } catch (error) {
            toast({
                title: "Error updating furniture",
                description: error.message,
                status: "error",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
        } finally {
            setLoading(false);
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
                    <Flex w="full" direction="row" justifyContent="space-between" mb={6}>
                        <Flex w="full" direction="row" alignItems="center" gap={4}>
                            <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                            <Text fontSize="2xl" fontWeight="700" color="#d69511">Edit {furniture?.name}</Text>
                            <Divider h={"2rem"} orientation="vertical" borderWidth="1px" borderColor="gray.300"/>    
                            <Flex direction="row" alignItems="center" gap={2}>
                                {
                                    Array(5)
                                        .fill('')
                                        .map((_, i) => (
                                            i < Math.floor(furniture?.ratings) ? (
                                            <FaStar key={i} color='#d69511' />
                                            ) : (
                                            i === Math.floor(furniture?.ratings) && furniture?.ratings % 1 !== 0 ? (
                                                <FaStarHalf key={i} color='#d69511' />
                                            ) : (
                                                <FaStar key={i} color='gray' />
                                            )
                                            )
                                        ))
                                }
                                <Box as='span' ml='2' color='gray.600' fontSize='sm'>
                                    { furniture?.reviews ? Object.values(furniture?.reviews).length : 0 } ratings
                                </Box>
                            </Flex>   
                            <Divider h={"2rem"} orientation="vertical" borderWidth="1px" borderColor="gray.300"/>    
                            <Flex direction="row" alignItems="center" gap={2}>
                                <IoIosHeart color='red' size='25'/>
                                <Text color='gray.600' fontSize='sm'>{furniture?.favourites?.length || 0} favourites</Text>
                            </Flex>       
                        </Flex>
                        <Button colorScheme="blue" variant="solid" onClick={handleSubmit(onSubmit)}>Confirm & Submit</Button>
                    </Flex>    

                    <Flex w="full" direction="column" gap={3} mb={5}>
                        {
                            lowInventory.length > 0 && (
                                <Flex w="full" direction="row">
                                    <Alert status="warning" size={"lg"}>
                                        <AlertIcon />
                                        <Text fontSize="sm" fontWeight="semibold">
                                            Low inventory for the following variants: 
                                        </Text>
                                        <Flex direction="row" gap={3} ml={4}>
                                            <Text fontSize="md" fontWeight={"semibold"} color={"red"}>
                                                {
                                                    lowInventory.map((color, index) => (
                                                        index === lowInventory.length - 1 ? color : color + ', '
                                                    ))
                                                }
                                            </Text>
                                        </Flex>
                                    </Alert>
                                </Flex>
                            )
                        }
                        {
                            outOfStock.length > 0 && (
                                <Flex w="full" direction="row">
                                    <Alert status="error" size={"lg"}>
                                        <AlertIcon />
                                        <Text fontSize="sm" fontWeight="semibold">
                                            Out of stock for the following variants: 
                                        </Text>
                                        <Flex direction="row" gap={3} ml={4}>
                                            <Text fontSize="md" fontWeight={"semibold"} color={"red"}>
                                                {
                                                    outOfStock.map((color, index) => (
                                                        index === outOfStock.length - 1 ? color : color + ', '
                                                    ))
                                                }
                                            </Text>
                                        </Flex>
                                    </Alert>
                                </Flex>
                            )
                        }
                    </Flex>

                    <form action="/api/add-furniture" method="post" encType="multipart/form-data">
                        <Flex w="full" direction="column" gap={6}>
                            <Flex w="full" direction="row" gap={8}>
                                <Flex w="full" direction="column" gap={6}>
                                    <Flex w="full" direction="row" gap={6}>
                                        <FormControl>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Subcategory Name
                                            </FormLabel>
                                            <Select
                                                variant="filled"
                                                type="text"
                                                id="subcategory"
                                                rounded="md"
                                                defaultValue={subcategory?.id || ""}
                                                {
                                                    ...register("subcategory", {
                                                        required: "Subcategory is required"
                                                    })
                                                }
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                            >
                                                {
                                                    subcategories.map((subcat) => (
                                                        <option key={subcat.id} value={subcat.id}>
                                                            {subcat.name}
                                                        </option>
                                                    ))
                                                }
                                            </Select>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Category Name
                                            </FormLabel>
                                            <Input
                                                variant="filled"
                                                type="text"
                                                id="category"
                                                defaultValue={category?.name || ""}
                                                isReadOnly
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                                p={2.5}
                                            />
                                        </FormControl>                                                                   
                                    </Flex>

                                    <Flex w="full" direction="row" gap={6}>
                                        <FormControl isInvalid={errors.name}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                Furniture Name <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftAddon><IoBedOutline/></InputLeftAddon>
                                                <Input
                                                    variant="filled"
                                                    type="text"
                                                    id="name"
                                                    defaultValue={furniture?.name || ""}
                                                    {
                                                        ...register("name", {
                                                            required: "Furniture name is required"
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
                                            </InputGroup>
                                            <FormErrorMessage>
                                                {errors.name && errors.name.message}
                                            </FormErrorMessage>
                                        </FormControl>  

                                        <FormControl isInvalid={errors.material}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                Furniture Material <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftAddon><MdOutlineTexture/></InputLeftAddon>
                                                <Input
                                                    variant="filled"
                                                    type="text"
                                                    id="material"
                                                    defaultValue={furniture?.material || ""}
                                                    {
                                                        ...register("material", {
                                                            required: "Furniture material is required"
                                                        })
                                                    }
                                                    placeholder="Cloth, Wood, Metal, etc."
                                                    rounded="md"
                                                    borderWidth="1px"
                                                    borderColor="gray.300"
                                                    color="gray.900"
                                                    size="md"
                                                    focusBorderColor="blue.500"
                                                    w="full"
                                                    p={2.5}
                                                />                                        
                                            </InputGroup>
                                            <FormErrorMessage>
                                                {errors.material && errors.material.message}
                                            </FormErrorMessage>
                                        </FormControl>                                          
                                    </Flex>

                                    
                                    <Flex w="full" direction="row" gap={3} alignItems="center">
                                        <Flex w="full" direction="row" gap={6} alignItems="center">
                                            <FormControl isInvalid={errors.height}>
                                                <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                    Height (CM) <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                                </FormLabel>
                                                <InputGroup>
                                                    <InputLeftAddon><RxHeight/></InputLeftAddon>
                                                    <Input
                                                        variant="filled"
                                                        type="number"
                                                        id="height"
                                                        defaultValue={furniture?.height || 0}
                                                        {
                                                            ...register("height", {
                                                                required: "Furniture height is required"
                                                            })
                                                        }
                                                        rounded="md"
                                                        borderWidth="1px"
                                                        borderColor="gray.300"
                                                        color="gray.900"
                                                        size="md"
                                                        focusBorderColor="blue.500"
                                                        w="full"
                                                        p={2.5}
                                                    />                                                
                                                </InputGroup>
                                                <FormErrorMessage>
                                                    {errors.height && errors.height.message}
                                                </FormErrorMessage>
                                            </FormControl> 

                                            <FormControl isInvalid={errors.width}>
                                                <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                    Width (CM) <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                                </FormLabel>
                                                <InputGroup>
                                                    <InputLeftAddon><RxWidth/></InputLeftAddon>
                                                    <Input
                                                        variant="filled"
                                                        type="number"
                                                        id="width"
                                                        defaultValue={furniture?.width || 0}
                                                        {
                                                            ...register("width", {
                                                                required: "Furniture width is required"
                                                            })
                                                        }
                                                        rounded="md"
                                                        borderWidth="1px"
                                                        borderColor="gray.300"
                                                        color="gray.900"
                                                        size="md"
                                                        focusBorderColor="blue.500"
                                                        w="full"
                                                        p={2.5}
                                                    />                                                
                                                </InputGroup>

                                                <FormErrorMessage>
                                                    {errors.width && errors.width.message}
                                                </FormErrorMessage>
                                            </FormControl> 

                                            <FormControl isInvalid={errors.length}>
                                                <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                    Length (CM) <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                                </FormLabel>
                                                <InputGroup>
                                                    <InputLeftAddon><RxSize/></InputLeftAddon>
                                                    <Input
                                                        variant="filled"
                                                        type="number"
                                                        id="length"
                                                        defaultValue={furniture?.length || 0}
                                                        {
                                                            ...register("length", {
                                                                required: "Furniture length is required"
                                                            })
                                                        }
                                                        rounded="md"
                                                        borderWidth="1px"
                                                        borderColor="gray.300"
                                                        color="gray.900"
                                                        size="md"
                                                        focusBorderColor="blue.500"
                                                        w="full"
                                                        p={2.5}
                                                    />                                                
                                                </InputGroup>
                                                <FormErrorMessage>
                                                    {errors.length && errors.length.message}
                                                </FormErrorMessage>
                                            </FormControl> 
                                        </Flex>
                                    </Flex>
                                    
                                    <Flex w="full" direction="row" gap={6}>
                                        <FormControl isInvalid={errors.price}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                Price <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftAddon>RM</InputLeftAddon>
                                                <Input
                                                    variant="filled"
                                                    type="number"
                                                    id="price"
                                                    defaultValue={furniture?.price || 0}
                                                    {
                                                        ...register("price", {
                                                            required: "Furniture price is required"
                                                        })
                                                    }
                                                    rounded="md"
                                                    borderWidth="1px"
                                                    borderColor="gray.300"
                                                    color="gray.900"
                                                    size="md"
                                                    focusBorderColor="blue.500"
                                                    w="full"
                                                    p={2.5}
                                                />                                           
                                            </InputGroup>

                                            <FormErrorMessage>
                                                {errors.price && errors.price.message}
                                            </FormErrorMessage>
                                        </FormControl>         

                                        <FormControl isInvalid={errors.cost}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                Cost <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftAddon>RM</InputLeftAddon>
                                                <Input
                                                    variant="filled"
                                                    type="number"
                                                    id="cost"
                                                    defaultValue={furniture?.cost || 0}
                                                    {
                                                        ...register("cost", {
                                                            required: "Furniture cost is required"
                                                        })
                                                    }
                                                    rounded="md"
                                                    borderWidth="1px"
                                                    borderColor="gray.300"
                                                    color="gray.900"
                                                    size="md"
                                                    focusBorderColor="blue.500"
                                                    w="full"
                                                    p={2.5}
                                                />                                           
                                            </InputGroup>

                                            <FormErrorMessage>
                                                {errors.cost && errors.cost.message}
                                            </FormErrorMessage>
                                        </FormControl>         

                                        <FormControl isInvalid={errors.weight}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                Weight (kg) <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                            </FormLabel>
                                            <InputGroup>
                                                <Input
                                                    variant="filled"
                                                    type="number"
                                                    id="weight"
                                                    defaultValue={furniture?.weight || 0}
                                                    {
                                                        ...register("weight", {
                                                            required: "Furniture weight cannot be empty",
                                                        })
                                                    }
                                                    rounded="md"
                                                    borderWidth="1px"
                                                    borderColor="gray.300"
                                                    color="gray.900"
                                                    size="md"
                                                    focusBorderColor="blue.500"
                                                    w="full"
                                                    p={2.5}
                                                />      
                                                <InputRightAddon>kg</InputRightAddon>                                     
                                            </InputGroup>

                                            <FormErrorMessage>
                                                {errors.weight && errors.weight.message}
                                            </FormErrorMessage>
                                        </FormControl>   

                                        <FormControl isInvalid={errors.discount}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Discount
                                            </FormLabel>
                                            <InputGroup>
                                                <Input
                                                    variant="filled"
                                                    type="number"
                                                    id="discount"
                                                    defaultValue={furniture?.discount || 0}
                                                    {
                                                        ...register("discount")
                                                    }
                                                    rounded="md"
                                                    borderWidth="1px"
                                                    borderColor="gray.300"
                                                    color="gray.900"
                                                    size="md"
                                                    focusBorderColor="blue.500"
                                                    w="full"
                                                    p={2.5}
                                                />         
                                                <InputRightAddon>%</InputRightAddon>                                  
                                            </InputGroup>

                                            <FormErrorMessage>
                                                {errors.discount && errors.discount.message}
                                            </FormErrorMessage>
                                        </FormControl>              
                                    </Flex>
                                </Flex>

                                <Flex w="full" direction="column" gap={6}>
                                    <FormControl isInvalid={errors.description}>
                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                            Description <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                        </FormLabel>        
                                        <Textarea
                                            variant="filled"
                                            type="text"
                                            id="description"
                                            defaultValue={furniture?.description || ""}
                                            {
                                                ...register("description", {
                                                    required: "Patient description cannot be empty",
                                                })
                                            }
                                            placeholder="Enter furniture description here..."
                                            rounded="md"
                                            h={"150px"}
                                            borderWidth="1px"
                                            borderColor="gray.300"
                                            color="gray.900"
                                            size="md"
                                            focusBorderColor="blue.500"
                                            w="full"
                                            p={2.5}
                                        />
                                        <FormErrorMessage>
                                            {errors.description && errors.description.message}
                                        </FormErrorMessage>
                                    </FormControl>    
                                    <FormControl isInvalid={errors.care_method}>
                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                            How to Care <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                        </FormLabel>        
                                        <Textarea
                                            variant="filled"
                                            type="text"
                                            id="care_method"
                                            defaultValue={furniture?.care_method || ""}
                                            {
                                                ...register("care_method", {
                                                    required: "Furniture care method cannot be empty",
                                                })
                                            }
                                            placeholder="Enter furniture care method here..."
                                            rounded="md"
                                            h={"150px"}
                                            borderWidth="1px"
                                            borderColor="gray.300"
                                            color="gray.900"
                                            size="md"
                                            focusBorderColor="blue.500"
                                            w="full"
                                            p={2.5}
                                        />
                                        <FormErrorMessage>
                                            {errors.care_method && errors.care_method.message}
                                        </FormErrorMessage>
                                    </FormControl>                                           
                                </Flex>
                            </Flex>

                            <Flex w="full" gap={6} alignItems="center" mt={6}>
                                <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                <Text fontSize="xl" fontWeight="700" color="#d69511">Variants</Text>
                                <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                <Select
                                    variant="filled"
                                    type="text"
                                    id="inventory"
                                    rounded="md"
                                    borderWidth="1px"
                                    borderColor="gray.300"
                                    color="gray.900"
                                    size="md"
                                    focusBorderColor="blue.500"
                                    w="full"
                                    onChange={(e) => setFilterInventory(e.target.value)}
                                >
                                    <option value="all">All Variants</option>
                                    <option value="low">Low Inventory (less than 10)</option>
                                    <option value="out">Out of Stock (0)</option>
                                </Select>
                            </Flex>

                            <Flex w="full" direction="column" gap={6}>
                                {
                                    Object.values(variants)
                                        .filter((variant) => {
                                            if (filterInventory === 'low') {
                                                return variant.inventory < 10 && variant.inventory > 0;
                                            } else if (filterInventory === 'out') {
                                                return variant.inventory == 0;
                                            } else {
                                                return true;
                                            }
                                        })
                                        .map((variant, index) => (
                                        <Flex key={index} gap={6} direction="column" w="full">
                                            <Flex w="full" direction="row" gap={6}>
                                                <Flex w="full" direction="column" gap={6}>
                                                    <FormControl isInvalid={errors.variants && errors.variants[index]?.color}>
                                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                            Color Variant <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                                        </FormLabel>
                                                        <InputGroup>
                                                            <InputLeftAddon><IoColorPaletteOutline/></InputLeftAddon>
                                                            <Input
                                                                variant="filled"
                                                                type="text"
                                                                id={`variant_color_${index}`}
                                                                value={variant?.color || ""}
                                                                onChange={(e) => handleChangeVariant(index, 'color', e.target.value)}
                                                                rounded="md"
                                                                borderWidth="1px"
                                                                borderColor="gray.300"
                                                                color="gray.900"
                                                                size="md"
                                                                focusBorderColor="blue.500"
                                                                w="full"
                                                                p={2.5}
                                                            />                                            
                                                        </InputGroup>
                                                        <FormErrorMessage>
                                                            {errors.variants && errors.variants[index]?.color && errors.variants[index]?.color.message}
                                                        </FormErrorMessage>
                                                    </FormControl>   
                                                    <FormControl>
                                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                            Variant Image <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                                        </FormLabel>
                                                        <Box
                                                            onDragEnter = {() => handleVariantImageDragEnter(index)}
                                                            onDragOver={handleVariantImageDragOver}
                                                            onDragLeave={() => handleVariantImageDragLeave(index)}
                                                            onDrop={(e) => handleVariantImageDrop(index, e)}
                                                            rounded="lg"
                                                            borderWidth="2px"
                                                            border={"dashed"}
                                                            borderColor={variant.isDraggingImage ? "blue.500" : "gray.300"}
                                                            p={4}
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
                                                                id="furniture_image"
                                                                position="absolute"
                                                                top={0}
                                                                left={0}
                                                                zIndex={1}
                                                                cursor="pointer"
                                                                isRequired
                                                                onChange={(e) => handleVariantImageInputChange(index, e)}
                                                            />
                                                            <Flex direction="column" alignItems="center">
                                                                <BsFillCloudArrowDownFill
                                                                    onDragEnter = {() => handleVariantImageDragEnter(index)}
                                                                    onDragOver={handleVariantImageDragOver}
                                                                    onDragLeave={() => handleVariantImageDragLeave(index)}
                                                                    onDrop={(e) => handleVariantImageDrop(index, e)}
                                                                    size={32}
                                                                    color={variant.isDraggingImage ? "blue" : "gray"}
                                                                />
                                                                <Text mb={2} fontSize="sm" fontWeight="semibold">
                                                                    {variant.isDraggingImage ? "Drop the file here" : "Drag & Drop or Click to upload"}
                                                                </Text>
                                                                <Text fontSize="xs" color="gray.500">
                                                                    (SVG, PNG, JPG, or JPEG)
                                                                </Text>
                                                            </Flex>
                                                        </Box>
                                                    </FormControl>                  
                                                </Flex>
                                                <Flex w="full" direction="column" gap={6}>
                                                    <FormControl isInvalid={errors.variants && errors.variants[index]?.inventory}>
                                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                            Current Inventory <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                                        </FormLabel>
                                                        <InputGroup>
                                                            <InputLeftAddon><MdOutlineInventory/></InputLeftAddon>
                                                            <Input
                                                                variant="filled"
                                                                type="number"
                                                                id={`variant_inventory_${index}`}
                                                                value={variant.inventory}
                                                                onChange={(e) => handleChangeVariant(index, 'inventory', e.target.value)}
                                                                rounded="md"
                                                                borderWidth="1px"
                                                                borderColor="gray.300"
                                                                color="gray.900"
                                                                size="md"
                                                                focusBorderColor="blue.500"
                                                                w="full"
                                                                p={2.5}
                                                            />                                            
                                                        </InputGroup>
                                                        <FormErrorMessage>
                                                            {errors.variants && errors.variants[index]?.inventory && errors.variants[index]?.inventory.message}
                                                        </FormErrorMessage>
                                                    </FormControl>      

                                                    <FormControl>
                                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                            Variant 3D Model
                                                        </FormLabel>
                                                        <Box
                                                                onDragEnter = {() => handleVariantModelDragEnter(index)}
                                                                onDragOver={handleVariantModelDragOver}
                                                                onDragLeave={() => handleVariantModelDragLeave(index)}
                                                                onDrop={(e) => handleVariantModelDrop(index, e)}
                                                                rounded="lg"
                                                                borderWidth="2px"
                                                                border={"dashed"}
                                                                borderColor={variant.isDraggingModel ? "blue.500" : "gray.300"}
                                                                p={4}
                                                                textAlign="center"
                                                                position={"relative"}
                                                                cursor="pointer"
                                                            >
                                                                <Input
                                                                    type="file"
                                                                    accept=".glb"
                                                                    opacity={0}
                                                                    width="100%"
                                                                    height="100%"
                                                                    id="3d_model"
                                                                    position="absolute"
                                                                    top={0}
                                                                    left={0}
                                                                    zIndex={1}
                                                                    cursor="pointer"
                                                                    isRequired
                                                                    onChange={(e) => handleVariantModelInputChange(index, e)}
                                                                />
                                                                <Flex direction="column" alignItems="center">
                                                                    <BsFillCloudArrowDownFill
                                                                        onDragEnter = {() => handleVariantModelDragEnter(index)}
                                                                        onDragOver={handleVariantModelDragOver}
                                                                        onDragLeave={() => handleVariantModelDragLeave(index)}
                                                                        onDrop={(e) => handleVariantModelDrop(index, e)}
                                                                        size={32}
                                                                        color={variant.isDraggingModel ? "blue" : "gray"}
                                                                    />
                                                                    <Text mb={2} fontSize="sm" fontWeight="semibold">
                                                                        {variant.isDraggingModel ? "Drop the file here" : "Drag & Drop or Click to upload"}
                                                                    </Text>
                                                                    <Text fontSize="xs" color="gray.500">
                                                                        (.GLB)
                                                                    </Text>
                                                                </Flex>
                                                            </Box>
                                                    </FormControl>                                                
                                                </Flex>
                                                <Flex w="full" direction="column" gap={6}>
                                                    <FormControl>
                                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                            Variant Icon Image
                                                        </FormLabel>
                                                        <Box
                                                                onDragEnter = {() => handleVariantIconDragEnter(index)}
                                                                onDragOver={handleVariantIconDragOver}
                                                                onDragLeave={() => handleVariantIconDragLeave(index)}
                                                                onDrop={(e) => handleVariantIconDrop(index, e)}
                                                                rounded="lg"
                                                                borderWidth="2px"
                                                                border={"dashed"}
                                                                borderColor={variant.isDraggingIcon ? "blue.500" : "gray.300"}
                                                                p={4}
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
                                                                    id="icon_image"
                                                                    position="absolute"
                                                                    top={0}
                                                                    left={0}
                                                                    zIndex={1}
                                                                    cursor="pointer"
                                                                    isRequired
                                                                    onChange={(e) => handleVariantIconInputChange(index, e)}
                                                                />
                                                                <Flex direction="column" alignItems="center">
                                                                    <BsFillCloudArrowDownFill
                                                                        onDragEnter = {() => handleVariantIconDragEnter(index)}
                                                                        onDragOver={handleVariantIconDragOver}
                                                                        onDragLeave={() => handleVariantIconDragLeave(index)}
                                                                        onDrop={(e) => handleVariantIconDrop(index, e)}
                                                                        size={32}
                                                                        color={variant.isDraggingIcon ? "blue" : "gray"}
                                                                    />
                                                                    <Text mb={2} fontSize="sm" fontWeight="semibold">
                                                                        {variant.isDraggingIcon ? "Drop the file here" : "Drag & Drop or Click to upload"}
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
                                                    h="245px"
                                                    id={`preview-image-container-${index}`}
                                                    bg={!variant?.image && !variant?.imageSrc ? "gray.200" : "transparent"}
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
                                                        src={variant?.imageSrc || variant?.image || ""}
                                                        alt={variant?.imageSrc || variant?.image ? "Preview" : ""}
                                                        display={variant?.imageSrc || variant?.image ? "block" : "none"}
                                                        style={{
                                                            height: "100%", 
                                                            objectFit: "contain", 
                                                            objectPosition: "center" 
                                                        }}
                                                    />
                                                </Box>      
                                                <Box
                                                    w="full"
                                                    h="245px"
                                                    id={`preview-icon-container-${index}`}
                                                    bg={!variant?.icon && !variant?.iconSrc ? "gray.200" : "transparent"}
                                                    rounded="lg"
                                                    display="flex"
                                                    flexDir="column"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    mt={4}
                                                    overflow="hidden" 
                                                >
                                                    <img
                                                        id={`preview-icon-${index}`}
                                                        src={variant?.iconSrc || variant?.icon || ""}
                                                        alt={variant?.iconSrc || variant?.icon ? "Preview" : ""}
                                                        display={variant?.iconSrc || variant?.icon ? "block" : "none"}
                                                        style={{
                                                            height: "100%", 
                                                            objectFit: "contain", 
                                                            objectPosition: "center" 
                                                        }}
                                                    />
                                                </Box>  
                                                <Box
                                                    w="full"
                                                    h="245px"
                                                    id={`preview-model-container-${index}`}
                                                    bg={!variant?.model && !variant?.modelSrc ? "gray.200" : "transparent"}
                                                    rounded="lg"
                                                    display="flex"
                                                    flexDir="column"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    mt={4}
                                                    overflow="hidden" 
                                                >
                                                    {
                                                        variant?.modelSrc ? (
                                                            <ModelPreview model={variant?.modelSrc} />
                                                        ) : (
                                                            <ModelPreview model={variant?.model} />
                                                        )
                                                    }
                                                </Box>      
                                                <Divider h={"15rem"} orientation="vertical" borderWidth="1px" borderColor="gray.300"/>       
                                                <Flex h="auto" alignItems="center" justifyContent="center" gap={4} direction="column">
                                                    {variant?.id ? (
                                                        variant?.isDeleted ? (
                                                            <Button colorScheme="blue" variant="solid" onClick={(e) => { e.preventDefault(); handleOpenRevertModal(index); }}><RiArrowGoBackFill size="20px"/></Button>
                                                        ) : (
                                                            <Button colorScheme="red" variant="solid" onClick={(e) => { e.preventDefault(); handleOpenDeleteModal(index); }}><FaTrash size="20px"/></Button>
                                                        )
                                                    ) : (
                                                        <Button colorScheme="red" variant="solid" onClick={() => handleRemoveVariant(index)}><FaTrash size="20px"/></Button>
                                                    )}

                                                    {index === variants.length - 1 ? (
                                                        <Button colorScheme="green" variant="solid" onClick={handleAddVariant}><FaPlus size="20px"/></Button>
                                                    ) : null}
                                                </Flex>        
                                                { isOpenDeleteModal && selectedVariantForDelete === index && (
                                                    <Modal size='xl' isCentered isOpen={isOpenDeleteModal} onClose={handleCloseDeleteModal}>
                                                        <ModalOverlay
                                                            bg='blackAlpha.300'
                                                        />
                                                        <ModalContent>
                                                            <ModalHeader>Confirmation For Deleting Variant</ModalHeader>
                                                            <ModalCloseButton _focus={{
                                                                boxShadow: 'none',
                                                                outline: 'none',
                                                            }} />
                                                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300"/>
                                                            <ModalBody>
                                                                <Text fontSize='md' letterSpacing='wide' fontWeight='bold' mb={2}>
                                                                    Confirm Deletion Of {variant?.color}?
                                                                </Text>
                                                                <Text mb={2} textAlign="justify">
                                                                    Approving deletion of {variant?.color} will officially remove the subcategory in the system. Furnitures
                                                                    associated with this subcategory will be unavailable after deletion.
                                                                </Text>
                                                            </ModalBody>
                                                            <ModalFooter>
                                                                <Box display='flex'>
                                                                    <Button mr={3} colorScheme="red" onClick={(e) => {handleRemoveVariant(index); }}>Confirm</Button>
                                                                    <Button colorScheme="blue" onClick={handleCloseDeleteModal}>Close</Button>
                                                                </Box>
                                                            </ModalFooter>
                                                        </ModalContent>
                                                    </Modal>                                                  
                                                )}

                                                { isOpenRevertModal && selectedVariantForRevert === index && (
                                                    <Modal size='xl' isCentered isOpen={isOpenRevertModal} onClose={handleCloseRevertModal}>
                                                        <ModalOverlay
                                                            bg='blackAlpha.300'
                                                        />
                                                        <ModalContent>
                                                            <ModalHeader>Confirmation For Restoring Variant</ModalHeader>
                                                            <ModalCloseButton _focus={{
                                                                boxShadow: 'none',
                                                                outline: 'none',
                                                            }} />
                                                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300"/>
                                                            <ModalBody>
                                                                <Text fontSize='md' letterSpacing='wide' fontWeight='bold' mb={2}>
                                                                    Confirm Restoration Of {variant?.color}?
                                                                </Text>
                                                                <Text mb={2} textAlign="justify">
                                                                    Approving restoration of {variant?.color} will officially add the removed subcategory in the system. Furnitures
                                                                    associated with this subcategory will be available after restoration.
                                                                </Text>
                                                            </ModalBody>
                                                            <ModalFooter>
                                                                <Box display='flex'>
                                                                    <Button mr={3} colorScheme="red" onClick={(e) => {handleRemoveVariant(index); }}>Confirm</Button>
                                                                    <Button colorScheme="blue" onClick={handleCloseRevertModal}>Close</Button>
                                                                </Box>
                                                            </ModalFooter>
                                                        </ModalContent>
                                                    </Modal>    
                                                )}                  
                                            </Flex>
                                            <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                        </Flex>
                                    ))
                                }                                

                            </Flex>

                            <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                        </Flex>
                    </form>
                </Flex>
            </Box>
        </Flex>
    )
}

export default EditFurniture;