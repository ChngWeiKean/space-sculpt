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
    Textarea,
    useToast,
    Divider,
    InputGroup,
    Spinner,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill } from "react-icons/bs";
import { RxCross1, RxHeight, RxWidth, RxSize } from "react-icons/rx";
import { IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline } from "react-icons/io5";
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
    
    const [model, setModel] = useState(null);
    const [furnitureModel, setFurnitureModel] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [isDragModelActive, setIsDragModelActive] = useState(false);

    const handleModelDragEnter = (e) => {
		e.preventDefault();
		setIsDragModelActive(true);
	};
	
	const handleModelDragOver = (e) => {
		e.preventDefault();
		setIsDragModelActive(true);
	};
	
	const handleModelDragLeave = () => {
		setIsDragModelActive(false);
	};

    const handleModelDrop = (e) => {
		e.preventDefault();
		setIsDragModelActive(false);
		const file = e.dataTransfer.files[0];
		handleModelInputChange(file);
	};

    const isModelFile = (file) => {
        const fileName = file.name.toLowerCase();
        console.log(fileName);
        const isGLB = fileName.endsWith('.glb');
        return isGLB;
    };

    const handleModelInputChange = (event) => {
        const file = event.target.files[0];
        if (isModelFile(file)) {
            setFurnitureModel(file);
            setModel(URL.createObjectURL(file));
            const fileExtension = file.name.split('.').pop().toLowerCase();
            setFileType(fileExtension);
            console.log(fileExtension);
            console.log("Model uploaded");
        } else {
            alert("Invalid file type. Please upload a 3D model.");
            console.log("Invalid file type. Please upload a 3D model.");
        }
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
    
            let loader;
            if (fileType === 'glb' || fileType === 'gltf') {
                loader = new GLTFLoader();
            } else if (fileType === 'obj') {
                loader = new OBJLoader();
            } else {
                return;
            }
    
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
            
        }, [model, fileType]);
    
        return (
            <Box ref={containerRef} h="600px" w="full" position="relative">
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
            image: image,
            model: furnitureModel,
            ...data,
        };

        if (furnitureData.height < 0 || furnitureData.width < 0 || furnitureData.length < 0 || furnitureData.price < 0 || furnitureData.inventory < 0) {
            toast({
                title: "Error creating furniture",
                description: "Please make sure that all number fields are positive",
                status: "error",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
            return;
        }

        if (!image) {
            toast({
                title: "Error creating furniture",
                description: "Furniture image is required",
                status: "error",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
            return;
        }
        console.log(furnitureData);

        try {
            await addFurniture(furnitureData);
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
                            <Flex w="full" direction="row" gap={6}>
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
                                                rounded="xl"
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
                                                rounded="xl"
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
                                                    rounded="xl"
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

                                        <FormControl isInvalid={errors.texture}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                Furniture Texture <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftAddon><MdOutlineTexture/></InputLeftAddon>
                                                <Input
                                                    variant="filled"
                                                    type="text"
                                                    id="texture"
                                                    {
                                                        ...register("texture", {
                                                            required: "Furniture texture cannot be empty",
                                                        })
                                                    }
                                                    placeholder="Cloth, Wood, Metal, etc."
                                                    rounded="xl"
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
                                                {errors.texture && errors.texture.message}
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
                                                        {
                                                            ...register("height", {
                                                                required: "Furniture Height cannot be empty",
                                                            })
                                                        }
                                                        rounded="xl"
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
                                                        {
                                                            ...register("width", {
                                                                required: "Furniture Width cannot be empty",
                                                            })
                                                        }
                                                        rounded="xl"
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
                                                        {
                                                            ...register("length", {
                                                                required: "Furniture Length cannot be empty",
                                                            })
                                                        }
                                                        rounded="xl"
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
                                                    rounded="xl"
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
                                        
                                        <FormControl isInvalid={errors.inventory}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                                Current Inventory <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftAddon><MdOutlineInventory/></InputLeftAddon>
                                                <Input
                                                    variant="filled"
                                                    type="number"
                                                    id="inventory"
                                                    {
                                                        ...register("inventory", {
                                                            required: "Furniture Inventory cannot be empty",
                                                        })
                                                    }
                                                    rounded="xl"
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
                                                {errors.inventory && errors.inventory.message}
                                            </FormErrorMessage>
                                        </FormControl>                       
                                    </Flex>

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
                                            {errors.description && errors.description.message}
                                        </FormErrorMessage>
                                    </FormControl>

                                </Flex>

                                <Flex w="full" direction="column" gap={6}>
                                    <FormControl>
                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                            Furniture Image <Text as="span" color="red.500" fontWeight="bold">*</Text>
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
                                                id="furniture_image"
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
                                    <Box
                                        w="full"
                                        h="300px"
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
                            </Flex>
                            <Flex w="full" direction="column" gap={3}>
                                <FormControl>
                                    <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                        3D Model
                                    </FormLabel>
                                    <Box
                                            onDragEnter={handleModelDragEnter}
                                            onDragOver={handleModelDragOver}
                                            onDragLeave={handleModelDragLeave}
                                            onDrop={handleModelDrop}
                                            rounded="lg"
                                            borderWidth="2px"
                                            border={"dashed"}
                                            borderColor={isDragModelActive ? "blue.500" : "gray.300"}
                                            p={8}
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
                                                onChange={handleModelInputChange}
                                            />
                                            <Flex direction="column" alignItems="center">
                                                <BsFillCloudArrowDownFill
                                                    onDragEnter={handleModelDragEnter}
                                                    onDragOver={handleModelDragOver}
                                                    onDragLeave={handleModelDragLeave}
                                                    onDrop={handleModelDrop}
                                                    size={32}
                                                    color={isDragModelActive ? "blue" : "gray"}
                                                />
                                                <Text mb={2} fontSize="sm" fontWeight="semibold">
                                                    {isDragModelActive ? "Drop the file here" : "Drag & Drop or Click to upload"}
                                                </Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    (.GLB)
                                                </Text>
                                            </Flex>
                                        </Box>
                                </FormControl>
                                <Box>
                                    {
                                        model && <ModelPreview model={model}/>
                                    }
                                </Box>
                            </Flex>
                        </Flex>
                    </form>
                </Flex>
            </Box>
        </Flex>
    )
}

export default AddFurniture;