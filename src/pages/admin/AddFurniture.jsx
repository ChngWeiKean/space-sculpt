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
    AbsoluteCenter,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill } from "react-icons/bs";
import { RxCross1, RxHeight, RxWidth, RxSize } from "react-icons/rx";
import { IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline, IoColorPaletteOutline } from "react-icons/io5";
import { AiOutlineDash } from "react-icons/ai";
import { FaPlus, FaTrash  } from "react-icons/fa6";
import { MdOutlineInventory, MdOutlineTexture } from "react-icons/md";
import { Form, useForm } from "react-hook-form";
import { NavLink, useParams } from 'react-router-dom';
import { db } from "../../../api/firebase";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { onValue, ref, query, orderByChild, equalTo, set } from "firebase/database";
import { addFurniture } from "../../../api/admin";
import JSZip from 'jszip';

function AddFurniture() {
    const { id } = useParams();
    const [ subcategory, setSubcategory ] = useState(null);
    const [ category, setCategory ] = useState(null);
    const {
        handleSubmit,
        register,
        formState: {
            errors, isSubmitting
        }
    } = useForm();

    const initialVariant = { color: '', inventory: 0, image: '', imageSrc: '', model: '', modelSrc: '', isDraggingImage: false, isDraggingModel: false };
    const [variants, setVariants] = useState([initialVariant]);

    const handleAddVariant = () => {
        setVariants([...variants, { ...initialVariant }]);
    };

    const handleRemoveVariant = (indexToRemove) => {
        if (variants.length > 1) {
            setVariants(variants.filter((_, index) => index !== indexToRemove));
        }
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
        const subcategoryRef = ref(db, `subcategories/${id}`);
        onValue(subcategoryRef, (snapshot) => {
            setSubcategory(snapshot.val());
            const categoryRef = ref(db, `categories/${snapshot.val().category}`);
            onValue(categoryRef, (snapshot) => {
                setCategory(snapshot.val());
            });
        });
    }, [ id ]);

    const toast = useToast();
    const [isLoading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        const furnitureData = {
            subcategory: id,
            ...data,
        };

        const furnitureVariants = variants.map((variant) => ({
            color: variant.color,
            inventory: variant.inventory,
            image: variant.image,
            model: variant.model,
        }));

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
            if (furnitureVariants[i].color === '' || furnitureVariants[i].inventory === 0 || furnitureVariants[i].image === '' || furnitureVariants[i].model === '') {
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

        try {
            console.log("Furniture Data: ", furnitureData);
            console.log("Furniture Variants: ", furnitureVariants);
            await addFurniture(furnitureData, furnitureVariants);
            toast({
                title: "Furniture created successfully!",
                status: "success",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
            window.history.back();
        } catch (error) {
            toast({
                title: "Error creating furniture",
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
                    <Flex w="full" direction="row" justifyContent="space-between" mb={12}>
                        <Flex w="full" direction="row" alignContent="center" gap={4}>
                            <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                            <Text fontSize="2xl" fontWeight="700" color="#d69511">Add New Furniture</Text>
                        </Flex>
                        <Button colorScheme="blue" variant="solid" onClick={handleSubmit(onSubmit)}>Confirm & Submit</Button>
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
                                            <Input
                                                variant="filled"
                                                type="text"
                                                id="subcategory"
                                                defaultValue={subcategory?.name}
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
                                        <FormControl>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Category Name
                                            </FormLabel>
                                            <Input
                                                variant="filled"
                                                type="text"
                                                id="category"
                                                defaultValue={category?.name}
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
                                                    {
                                                        ...register("name", {
                                                            required: "Furniture name cannot be empty",
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
                                                    {
                                                        ...register("material", {
                                                            required: "Furniture material cannot be empty",
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
                                                    Height (cm) <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                                </FormLabel>
                                                <InputGroup>
                                                    <InputLeftAddon><RxHeight/></InputLeftAddon>
                                                    <Input
                                                        variant="filled"
                                                        type="number"
                                                        id="height"
                                                        {
                                                            ...register("height", {
                                                                required: "Furniture Height cannot be empty",
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
                                                    Width (cm) <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                                </FormLabel>
                                                <InputGroup>
                                                    <InputLeftAddon><RxWidth/></InputLeftAddon>
                                                    <Input
                                                        variant="filled"
                                                        type="number"
                                                        id="width"
                                                        {
                                                            ...register("width", {
                                                                required: "Furniture Width cannot be empty",
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
                                                    Length (cm) <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                                </FormLabel>
                                                <InputGroup>
                                                    <InputLeftAddon><RxSize/></InputLeftAddon>
                                                    <Input
                                                        variant="filled"
                                                        type="number"
                                                        id="length"
                                                        {
                                                            ...register("length", {
                                                                required: "Furniture Length cannot be empty",
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
                                                    {
                                                        ...register("price", {
                                                            required: "Furniture Price cannot be empty",
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
                                                    {
                                                        ...register("cost", {
                                                            required: "Furniture Cost cannot be empty",
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
                            <Flex w="full" gap={6} alignItems="center">
                                <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                <Text fontSize="xl" fontWeight="700" color="#d69511">Variants</Text>
                                <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                            </Flex>
                            <Flex w="full" direction="column" gap={6}>
                                {
                                    variants.map((variant, index) => (
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
                                                                value={variant.color}
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
                                                            Furniture Variant Image <Text as="span" color="red.500" fontWeight="bold">*</Text>
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
                                                            Furniture Variant 3D Model
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
                                                <Box
                                                    w="full"
                                                    h="245px"
                                                    id={`preview-image-container-${index}`}
                                                    bg={!variant.imageSrc ? "gray.200" : "transparent"}
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
                                                        src={variant.imageSrc || ""}
                                                        alt={variant.imageSrc ? "Preview" : ""}
                                                        display={variant.imageSrc ? "block" : "none"}
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
                                                    bg={!variant.modelSrc ? "gray.200" : "transparent"}
                                                    rounded="lg"
                                                    display="flex"
                                                    flexDir="column"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    mt={4}
                                                    overflow="hidden" 
                                                >
                                                    {
                                                        variant.model && <ModelPreview model={variant.modelSrc}/>
                                                    }
                                                </Box>      
                                                <Divider h={"15rem"} orientation="vertical" borderWidth="1px" borderColor="gray.300"/>       
                                                <Flex h="auto" alignItems="center" justifyContent="center" gap={4} direction="column">
                                                    {index > 0 && (
                                                        <Button colorScheme="red" variant="solid" onClick={() => handleRemoveVariant(index)}><FaTrash size="20px"/></Button>
                                                    )}
                                                    {index === variants.length - 1 ? (
                                                        <Button colorScheme="green" variant="solid" onClick={handleAddVariant}><FaPlus size="20px"/></Button>
                                                    ) : null}
                                                </Flex>                          
                                            </Flex>
                                            <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                        </Flex>
                                    ))
                                }
                            </Flex>
                        </Flex>
                    </form>
                </Flex>
            </Box>
        </Flex>
    )
}

export default AddFurniture;