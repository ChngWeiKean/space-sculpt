import {
	Text,
    Flex,
    Box,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    useToast,
    Divider,
    InputGroup,
    Spinner,
    Select,
    Badge,
    Tooltip,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill } from "react-icons/bs";
import { RxCross1, RxHeight, RxWidth, RxSize, RxDimensions } from "react-icons/rx";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline, IoCartOutline } from "react-icons/io5";
import { CiWarning } from "react-icons/ci";
import { GoSmiley } from "react-icons/go";
import { GrThreeD } from "react-icons/gr";
import { FaImage, FaRegFileImage } from "react-icons/fa6";
import { AiOutlineDash } from "react-icons/ai";
import { FaPlus, FaTrash, FaStar, FaStarHalf } from "react-icons/fa6";
import { MdOutlineInventory, MdOutlineTexture, MdLightbulbOutline } from "react-icons/md";
import { Form, useForm } from "react-hook-form";
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from "../../components/AuthCtx.jsx";
import { db } from "../../../api/firebase";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { onValue, ref, query, orderByChild, equalTo, set } from "firebase/database";
import { addToFavourites, addToCart } from "../../../api/customer.js";

function CustomerFurnitureDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const [furniture, setFurniture] = useState(null);
    const [subcategory, setSubcategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [displayMode, setDisplayMode] = useState('image');
    const { isOpen, onOpen, onClose } = useDisclosure()

    const handleImageClick = () => {
        setDisplayMode('image');
    };

    const handleModelClick = () => {
        setDisplayMode('model');
    };

    useEffect(() => {
        const furnitureRef = ref(db, `furniture/${id}`);
        onValue(furnitureRef, (snapshot) => {
            const furnitureVariants = Object.values(snapshot.val().variants);
            const firstVariantImage = furnitureVariants.length > 0 ? furnitureVariants.find((variant) => variant.inventory > 0).image : null;
            const firstVariantModel = furnitureVariants.length > 0 ? furnitureVariants.find((variant) => variant.inventory > 0).model : null;
            const firstVariantId = furnitureVariants.length > 0 ? Object.keys(snapshot.val().variants).find((key) => snapshot.val().variants[key].inventory > 0) : null;
            const firstVariantColor = furnitureVariants.length > 0 ? furnitureVariants.find((variant) => variant.inventory > 0).color : null;
            const firstVariantInventory = furnitureVariants.length > 0 ? furnitureVariants.find((variant) => variant.inventory > 0).inventory : null;
            let data = {
                id: snapshot.key,
                mainImage: firstVariantImage,
                selectedVariant: firstVariantId,
                model: firstVariantModel,
                selectedColor: firstVariantColor,
                inventory: firstVariantInventory,
                ...snapshot.val()
            }
            setFurniture(data);
            console.log(data);
            const subcategoryRef = ref(db, `subcategories/${data.subcategory}`);
            onValue(subcategoryRef, (snapshot) => {
                let data = {
                    id: snapshot.key,
                    ...snapshot.val()
                }
                setSubcategory(data);
            });   
        });
    }, [id]);

    useEffect(() => {
        const userRef = ref(db, `users/${user?.uid}`);
        onValue(userRef, (snapshot) => {
            const user = snapshot.val();
            setCart(user?.cart || []);
        });        
    }, [user]);

    const handleVariantClick = (selectedFurniture, variant) => {
        const variantImage = selectedFurniture.variants[variant].image;
        const variantColor = selectedFurniture.variants[variant].color;
        const variantModel = selectedFurniture.variants[variant].model;
        const variantInventory = selectedFurniture.variants[variant].inventory;
        setFurniture({
            ...selectedFurniture,
            mainImage: variantImage,
            selectedVariant: variant,
            selectedColor: variantColor,
            model: variantModel,
            inventory: variantInventory
        });
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
    
            camera.position.z = 2.5;
    
            const animate = () => {
                requestAnimationId = requestAnimationFrame(animate);
                renderer.render(scene, camera);
            };
            animate();

            function sceneTraverse (obj, fn) {
                if (!obj) return
    
                    fn(obj)
    
                if (obj.children && obj.children.length > 0) {
                    obj.children.forEach(o => {
                        sceneTraverse(o, fn)
                    })
                }
            }
    
            function dispose (e) {
                // dispose geometries and materials in scene
                sceneTraverse(scene, o => {
    
                    if (o.geometry) {
                        o.geometry.dispose()					                 
                    }
    
                    if (o.material) {
                        if (o.material.length) {
                            for (let i = 0; i < o.material.length; ++i) {
                                o.material[i].dispose()							
                            }
                        }
                        else {
                            o.material.dispose()						
                        }
                    }
                })	
                renderer && renderer.renderLists.dispose()
                renderer && renderer.dispose() 
                controls.dispose();
                renderer.domElement.parentElement.removeChild(renderer.domElement)			
                scene = null
                camera = null
                renderer = null  
            }

            return () => {
                if  (requestAnimationId) {
                    cancelAnimationFrame(requestAnimationId);
                }
                requestAnimationId = null;
                dispose();
            };
            
        }, [model]);
    
        return (
            <Box ref={containerRef} h="35rem" w="40rem" position="relative">
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

    const PriceTemplate = (rowData) => {
        let discountedPrice = 0.0;
        const discount = Number(rowData.discount);
        const price = Number(rowData.price);
        if (discount > 0) {
            discountedPrice = price - (price * discount / 100);
        }
    
        return (
            <Flex w="full" direction="row" gap={2}>
                {
                    Number(rowData.discount) > 0 ? (
                        <Flex w="full" direction="column">
                            <Flex direction="row" gap={3}>
                                <Flex direction="row" gap={2}>
                                    <Text fontWeight={600} fontSize="lg" color={"green"}>RM</Text>
                                    <Text fontWeight={600} fontSize="3xl">{discountedPrice}</Text>                
                                </Flex>                            
                                <Text fontWeight={600} fontSize="3xl" color={"red"} textDecoration="line-through">{rowData.price}</Text>                                
                            </Flex>                       
                        </Flex>
    
                    ) : (
                        <Flex direction="row" gap={2}>
                            <Text fontWeight={600} fontSize="lg" color={"green"}>RM</Text>
                            <Text fontWeight={600} fontSize="3xl">{rowData.price}</Text>                
                        </Flex>                        
                    )
                }
            </Flex>
        );
    }

    const DimensionTemplate = (rowData) => {
        return (
            <Flex w="full" direction="column" gap={2}>
                <Flex w="full" direction="row" gap={3} alignItems="center">
                    <Text fontSize="lg" fontWeight="700" color="gray.600" letterSpacing="wide">Dimensions</Text>
                </Flex>
                
                <Flex direction="column" gap={2}>
                    <Flex gap={3}>
                        <Text fontWeight="500" color="gray.500">Width:</Text>
                        <Text fontSize="md" fontWeight="600" letterSpacing="wide">{rowData.width} cm</Text>
                    </Flex>
                    <Flex gap={3}>
                        <Text fontWeight="500" color="gray.500">Height:</Text>
                        <Text fontSize="md" fontWeight="600" letterSpacing="wide">{rowData.height} cm</Text>
                    </Flex>
                    <Flex gap={3}>
                        <Text fontWeight="500" color="gray.500">Length:</Text>
                        <Text fontSize="md" fontWeight="600" letterSpacing="wide">{rowData.length} cm</Text>
                    </Flex>
                </Flex>
            </Flex>
        );
    }

    const MaterialTemplate = (rowData) => {
        return (
            <Flex w="full" direction="column" gap={2}>
                <Text fontSize="lg" fontWeight="700" color="gray.600" letterSpacing="wide">Material</Text>
                <Text fontSize="md" fontWeight="600" letterSpacing="wide">{rowData.material}</Text>
            </Flex>
        );
    };

    const InventoryTemplate = (rowData) => {
        return (
            <Flex w="full" direction="row" gap={2}>
                {rowData.inventory < 10 ?
                    <CiWarning color="red" size="25" />
                    :
                    <GoSmiley color="green" size="25" />
                }
                <Text>{rowData.inventory} in stock</Text>
            </Flex>
        );
    };

    const toggleLike = async (furnitureId) => {
        await addToFavourites(furnitureId, user?.uid);
    };

    const toast = useToast();

    const addFurnitureToCart = async (furnitureId, furnitureName, variantId) => {
        try {
            await addToCart(furnitureId, user?.uid, variantId);
            toast({
                title: "Added to cart",
                description: furnitureName + " has been added to your cart.",
                status: "success",
                position: "top",
                duration: 9000,
                isClosable: true,
            });            
        } catch (error) {
            console.error("Error adding to cart:", error);
            toast({
                title: "Error adding to cart",
                description: "An error occurred while adding " + furnitureName + " to your cart.",
                status: "error",
                position: "top",
                duration: 9000,
                isClosable: true,
            });
        }
    }

    return (
        <Flex w="full" h="full" p={4} gap={7} bg="#f4f4f4" direction="column">
            <Flex w="full" direction="row" gap={4}>
                <Flex w="20%" direction="column" gap={5} alignItems="center">
                    <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                    <Flex onClick={handleImageClick} direction="column"  alignItems="center" color="#d69511" transition="transform 0.2s" _hover={{ transform: 'scale(1.1)' }}>
                        <FaRegFileImage size="40px"/>
                        <Text>Image</Text>
                    </Flex>
                    {
                        furniture?.model && (
                            <Flex onClick={handleModelClick} direction="column" alignItems="center" color="#d69511" transition="transform 0.2s" _hover={{ transform: 'scale(1.1)' }}>
                                <GrThreeD size="40px"/>
                                <Text>3D Model</Text>
                            </Flex>    
                        )                        
                    }
                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                    <Flex onClick={onOpen} direction="column"  alignItems="center" color="blue.500" transition="transform 0.2s" _hover={{ transform: 'scale(1.1)' }}>
                        <MdLightbulbOutline size="40px"/>
                        <Text>How to Care</Text>
                    </Flex>

                    <Modal size='xl' isOpen={isOpen} onClose={onClose}>
                        <ModalOverlay
                            bg='blackAlpha.300'
                        />
                        <ModalContent>
                            <ModalHeader>
                                <Text fontSize="lg" fontWeight="700" color="gray.600" letterSpacing="wide">How to Care</Text>
                            </ModalHeader>
                            <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                            <ModalBody>
                                <Text fontSize="md" fontWeight="500" color="gray.600" letterSpacing="wide">{furniture?.care_method}</Text>
                            </ModalBody>
                            <ModalFooter>
                                <Button colorScheme="blue" mr={3} onClick={onClose}>
                                    Close
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>                        
                </Flex>
                <Flex w="100rem" direction="column" gap={4}>
                    {
                        displayMode === 'image' && (
                            <Flex w="full">
                                <img src={furniture?.mainImage} alt={furniture?.name} style={{ objectFit: "contain", width: "100%", height: "100%" }}/>
                            </Flex>
                        )
                    }
                    {
                        displayMode === 'model' && (
                            <ModelPreview model={furniture?.model}/>
                        )
                    }
                </Flex>
                <Flex w="full" direction="column" gap={5} mx={12}>
                    <Flex w="full" direction="row" gap={3} alignItems="center">
                        <Box display='flex' alignItems='center'>
                            {
                                Array(5)
                                    .fill('')
                                    .map((_, i) => (
                                        i < Math.floor(furniture?.ratings) ? (
                                        <FaStar size={"25px"} key={i} color='#d69511' />
                                        ) : (
                                        i === Math.floor(furniture?.ratings) && furniture?.ratings % 1 !== 0 ? (
                                            <FaStarHalf size={"25px"} key={i} color='#d69511' />
                                        ) : (
                                            <FaStar size={"25px"} key={i} color='gray' />
                                        )
                                        )
                                    ))
                            }
                            <Box as='span' ml='2' color='gray.600' fontSize='md'>
                                {furniture?.ratings || 0} ratings
                            </Box>
                        </Box>              
                        <Divider h="1rem" borderWidth="1px" variant="solid" orientation="vertical" borderColor="gray.500"/>
                        <Flex gap={2} alignItems="center" color='red' onClick={() => toggleLike(furniture?.id)} transition="transform 0.2s" _hover={{ transform: 'scale(1.2)' }}>
                            {user?.favourites?.includes(furniture?.id) ? <IoIosHeart size={"25px"}/> : <IoIosHeartEmpty size={"25px"}/>} <Text fontSize="md">({furniture?.favourites?.length || 0})</Text>
                        </Flex>                        
                        <Divider h="1rem" borderWidth="1px" variant="solid" orientation="vertical" borderColor="gray.500"/>
                        <Text fontSize="md" fontWeight="500" color="gray.500">{subcategory?.name}</Text>
                        <Divider h="1rem" borderWidth="1px" variant="solid" orientation="vertical" borderColor="gray.500"/>
                        <Flex>
                            <InventoryTemplate {...furniture}/>
                        </Flex>
                    </Flex>
                    <Flex w="full" direction="row" gap={2} alignItems="center">
                        <Text fontSize="3xl" letterSpacing={"wide"} fontWeight="700" color='#d69511'>{furniture?.name}</Text>
                        
                        {
                            furniture?.discount > 0 ? (
                                <Badge colorScheme="red" fontSize="md" color="red" ml={5}>-{furniture?.discount}%</Badge>   
                            ) : null
                        }
                    </Flex>

                    <Flex w="full" direction="row">
                        <Text fontSize="md" fontWeight="500" color="gray.600" letterSpacing="wide">{furniture?.description}</Text>
                    </Flex>
                    <Flex w="full" direction="row" gap={4} mb={3}>
                        {
                            furniture?.variants && Object.keys(furniture?.variants).length > 1 ? (
                                Object.keys(furniture?.variants).map((variant, index) => (
                                    furniture?.variants[variant]?.inventory > 0 ? (
                                        <Tooltip key={index} label={furniture?.variants[variant]?.color} aria-label="Variant color" placement="top">
                                            <Box
                                                transition="transform 0.2s"
                                                _hover={{ transform: 'scale(1.1)' }}
                                                outline= {furniture?.selectedVariant == variant ? '1px solid blue' : 'none'}
                                                p={1}
                                                onClick={(e) => { e.preventDefault(); handleVariantClick(furniture, variant); }}
                                            >
                                                <img src={furniture?.variants[variant]?.image} alt={furniture?.variants[variant]?.name} style={{ width: "75px", height: "75px", objectFit: "contain" }} />
                                            </Box>                                                
                                        </Tooltip>
                                    ) : (
                                        <Tooltip key={index} label={furniture?.variants[variant]?.color} aria-label="Variant color" placement="top">
                                            <Box key={index} onClick={(e) => { e.preventDefault(); }} position={"relative"}>
                                                <Badge colorScheme="red" fontSize="2xs" color="red" position="absolute" bottom="-1" right="-1">Out of Stock</Badge>
                                                <img src={furniture?.variants[variant]?.image} alt={furniture?.variants[variant]?.name} style={{ width: "75px", height: "75px", objectFit: "contain", filter: "grayscale(100%)" }} />
                                            </Box>
                                        </Tooltip>
                                    )
                                ))
                            ) : null
                        }
                    </Flex>
                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                    <Flex w="full" direction="row" gap={2}>
                        <DimensionTemplate {...furniture}/>

                        <Flex w="full" direction="column" gap={4}>
                            <MaterialTemplate {...furniture}/>

                        </Flex>
                    
                    </Flex>
                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                    <Flex direction="row" my={2}>
                        <PriceTemplate {...furniture}/>
                    </Flex>

                    {
                        cart?.find((item) => item?.variantId === furniture?.selectedVariant) ? (
                            <Flex w="full" direction="row" alignItems="center" gap={2}>
                                <Button
                                    w="full"
                                    colorScheme="green"
                                    variant="solid"
                                    borderRadius="full"
                                    leftIcon={<IoCartOutline />}
                                >
                                    Already In Cart
                                </Button>
                            </Flex>
                        ) : (
                            <Flex w="full" direction="row" alignItems="center" gap={2}>
                                <Button
                                    w="full"
                                    colorScheme="blue"
                                    variant="solid"
                                    borderRadius="full"
                                    leftIcon={<IoCartOutline />}
                                    onClick={(e) => {e.preventDefault(); addFurnitureToCart(furniture?.id, furniture?.name, furniture?.selectedVariant);}}
                                >
                                    Add To Cart
                                </Button>
                            </Flex>
                        )
                    }
                </Flex>
            </Flex>

            <Flex w="full" gap={6} alignItems="center">
                <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                <Text w="55%" fontSize="xl" fontWeight="700" color="#d69511">Reviews & Recommendations</Text>
                <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
            </Flex>
            
            <Flex w="full" direction="row" gap={4}>

            </Flex>
        </Flex>
    )
}

export default CustomerFurnitureDetails;