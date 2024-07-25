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
    InputRightElement,
    IconButton,
    InputRightAddon,
    Textarea,
    useToast,
    Divider,
    InputGroup,
    Spinner,
    Select,
    Badge,
    Alert,
    AlertIcon,
    Avatar,
    InputLeftElement,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill, BsPinMap } from "react-icons/bs";
import { RxCross1, RxHeight, RxWidth, RxSize, RxDimensions } from "react-icons/rx";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline, IoCartOutline } from "react-icons/io5";
import { CiWarning } from "react-icons/ci";
import { GoSmiley } from "react-icons/go";
import { GrThreeD } from "react-icons/gr";
import { FaImage, FaRegFileImage } from "react-icons/fa6";
import { AiOutlineDash } from "react-icons/ai";
import { CiCreditCard1 } from "react-icons/ci";
import { FaPlus, FaTrash, FaStar, FaStarHalf, FaMinus } from "react-icons/fa6";
import { FaRegUser, FaGenderless } from "react-icons/fa";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { TbPasswordFingerprint, TbGenderMale, TbGenderFemale } from "react-icons/tb";
import { MdOutlineInventory, MdOutlineTexture, MdOutlineAlternateEmail, MdDateRange } from "react-icons/md";
import { Form, useForm } from "react-hook-form";
import { NavLink, useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from "../../components/AuthCtx.jsx";
import { db } from "../../../api/firebase";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import { onValue, ref, query, orderByChild, equalTo, set } from "firebase/database";
import { updateProfile } from "../../../api/customer.js";
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import { encrypt, decrypt } from 'n-krypta'
import { fetchAndActivate, getValue } from "firebase/remote-config";
import { remoteConfig } from "../../../api/firebase.js";
import CryptoJS from 'crypto-js';

function CustomerProfile() {
    const {
        handleSubmit,
        register,
        setValue,
        formState: {
            errors
        }
    } = useForm();
    const { user } = useAuth();
    const [ showPassword, setShowPassword ] = useState(false);
    const [ image, setImage ] = useState(null);
    const [ imageSrc, setImageSrc ] = useState(null);
    const [ isDragActive, setIsDragActive ] = useState(false);
    const [ cards, setCards ] = useState(null);
    const addresses = user.addresses;

    const defaultAddress = Object.keys(addresses).filter(addressKey => addresses[addressKey].isDefault);
    const nonDefaultAddresses = Object.keys(addresses).filter(addressKey => !addresses[addressKey].isDefault);

    const sortedAddresses = [...defaultAddress, ...nonDefaultAddresses];

    const decryptAES = (combined, key) => {
        const combinedWordArray = CryptoJS.enc.Base64.parse(combined);
        const iv = CryptoJS.lib.WordArray.create(combinedWordArray.words.slice(0, 4));
        const ciphertext = CryptoJS.lib.WordArray.create(combinedWordArray.words.slice(4));
    
        const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, CryptoJS.enc.Utf8.parse(key), {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    };   

    useEffect(() => {
        setValue("name", user?.name);
        setValue("email", user?.email);
        setValue("contact", user?.contact);
        setValue("gender", user?.gender);
        setValue("date_of_birth", user?.date_of_birth);
        setValue("password", user?.password);
        setImage(user?.profile_picture);
        setImageSrc(user?.profile_picture);

        fetchAndActivate(remoteConfig)
            .then(() => {
                const private_key = getValue(remoteConfig, 'private_key').asString();
                const decryptedCards = {};
                Object.keys(user?.cards).forEach(card => {
                    let decryptedNumber = decryptAES(user?.cards[card].number, private_key);
                    let decryptedExpiry = decryptAES(user?.cards[card].expiry, private_key);
                    let decryptedName = decryptAES(user?.cards[card].name, private_key);
                    decryptedCards[card] = {
                        number: decryptedNumber,
                        expiry: decryptedExpiry,
                        name: decryptedName,
                    }
                });
                console.log(decryptedCards);
                setCards(decryptedCards);
            })
    }, [user]);

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

    const maskCardNumber = (number) => {
        const visibleDigits = 4;
        const masked = number.slice(0, visibleDigits) + "*".repeat(number.length - 8) + number.slice(-visibleDigits);
        return masked;
    };

    const toast = useToast();

    const onSubmit = async (data) => {
        const userData = {
            name: data.name,
            email: data.email,
            contact: data.contact,
            gender: data.gender,
            date_of_birth: data.date_of_birth,
            profile_picture: image,
            password: data.password,
        }
        console.log(userData);

        try {
            await updateProfile(user.uid, userData);
            toast({
                title: "Profile updated successfully.",
                description: "Your profile has been updated successfully.",
                status: "success",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
            setImage(null);
        } catch (error) {
            console.error(error);
            toast({
                title: "An error occurred.",
                description: "There was an error updating your profile. Please try again later.",
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
        }
    }

    return (
        <Flex w="full" minH="full" px={8} py={4} gap={7} bg="#f4f4f4" direction="row" position="relative">
            <Flex w="70%" direction="column" gap={7} pr={7}>
                <Flex w="full" direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Flex w="full" direction="row" alignItems="center" gap={4}>
                        <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                        <Text fontSize="2xl" fontWeight="700" color="#d69511">My Profile</Text>  
                    </Flex>
                    <Button colorScheme="blue" size="md" variant="solid" onClick={handleSubmit(onSubmit)}>Confirm & Submit</Button>
                </Flex> 
                <form action="/api/edit-profile" method="post" encType="multipart/form-data">
                    <Flex w="full" direction="column" gap={8}>
                        <Flex w="full" direction="column" gap={6}>
                            <Text fontSize="lg" fontWeight="600" color="gray.600" letterSpacing="wide">1. Personal Information</Text>
                            <Flex w="full" direction="row" gap={4}>
                                <FormControl id="name" isInvalid={errors.name}>
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide" requiredIndicator>
                                        Name
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftAddon>
                                            <Text fontSize="md" fontWeight="600" color="gray.600"><FaRegUser /></Text>
                                        </InputLeftAddon>
                                        <Input 
                                            variant="filled"
                                            type="text"
                                            defaultValue={user.name}
                                            id="name"
                                            {
                                                ...register("name", {
                                                    required: "Username cannot be empty."
                                                })
                                            }
                                            rounded="md"
                                            borderWidth="1px"
                                            borderColor="gray.300"
                                            color="gray.900"
                                            size="md"
                                            focusBorderColor="blue.500"
                                            w="full"
                                        />
                                    </InputGroup>
                                    <FormErrorMessage>
                                        {errors.name && errors.name.message}
                                    </FormErrorMessage>
                                </FormControl>
                                <FormControl id="email">
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide" requiredIndicator>
                                        Email Address
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftAddon>
                                            <Text fontSize="md" fontWeight="600" color="gray.600"><MdOutlineAlternateEmail /></Text>
                                        </InputLeftAddon>
                                        <Input 
                                            variant="filled"
                                            type="email"
                                            defaultValue={user.email}
                                            id="email"
                                            {
                                                ...register("email", {
                                                    required: "User email cannot be empty."
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
                                </FormControl>
                                <FormControl id="contact">
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide" requiredIndicator>
                                        Contact Number
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftAddon>
                                            <Text fontSize="md" fontWeight="600" color="gray.600">+60</Text>
                                        </InputLeftAddon>
                                        <Input 
                                            variant="filled"
                                            type="text"
                                            defaultValue={user.contact}
                                            id="contact"
                                            {
                                                ...register("contact", {
                                                    required: "User contact number cannot be empty."
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
                                </FormControl>
                            </Flex>
                            <Flex w="full" direction="row" gap={4}>
                                <FormControl id="gender">
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                        Gender
                                    </FormLabel>
                                    <Select
                                        variant="filled"
                                        defaultValue={user.gender}
                                        id="gender"
                                        {
                                            ...register("gender")
                                        }
                                        rounded="md"
                                        borderWidth="1px"
                                        borderColor="gray.300"
                                        color="gray.900"
                                        size="md"
                                        focusBorderColor="blue.500"
                                        w="full"
                                    >
                                        <option value="">Select your gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </Select>
                                </FormControl>
                                <FormControl id="dob">
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                        Date of Birth
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftAddon>
                                            <Text fontSize="md" fontWeight="600" color="gray.600"><MdDateRange /></Text>
                                        </InputLeftAddon>
                                        <Input 
                                            variant="filled"
                                            type="date"
                                            defaultValue={user.date_of_birth}
                                            id="date_of_birth"
                                            {
                                                ...register("date_of_birth")
                                            }
                                            rounded="md"
                                            borderWidth="1px"
                                            borderColor="gray.300"
                                            color="gray.900"
                                            size="md"
                                            focusBorderColor="blue.500"
                                            w="full"
                                        />
                                    </InputGroup>
                                </FormControl>
                                <FormControl id="password" isInvalid={errors.password}>
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide" requiredIndicator>
                                        Password
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftAddon>
                                            <Text fontSize="md" fontWeight="600" color="gray.600"><TbPasswordFingerprint /></Text>
                                        </InputLeftAddon>
                                        <Input 
                                            variant="filled"
                                            type={showPassword ? 'text' : 'password'}
                                            defaultValue={user.password}
                                            id="password"
                                            {
                                                ...register("password", {
                                                    required: "User password cannot be empty.",
                                                    pattern: {
                                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&])[A-Za-z\d@$!%#*?&]{8,}$/,
                                                        message: "Invalid password format",
                                                    },
                                                })
                                            }
                                            rounded="md"
                                            borderWidth="1px"
                                            borderColor="gray.300"
                                            color="gray.900"
                                            size="md"
                                            focusBorderColor="blue.500"
                                            w="full"
                                        />
                                        <InputRightElement>
                                            <IconButton aria-label="Show password" size="lg" variant="ghost"
                                                icon={showPassword ? <IoMdEyeOff/> : <IoMdEye/>}
                                                _focus={{bg: "transparent", borderColor: "transparent", outline: "none"}}
                                                _hover={{bg: "transparent", borderColor: "transparent", outline: "none"}}
                                                _active={{bg: "transparent", borderColor: "transparent", outline: "none"}}
                                                onClick={() => setShowPassword(!showPassword)}
                                                tabIndex="-1"
                                            />
                                        </InputRightElement>
                                    </InputGroup>
                                    <FormErrorMessage>
                                        {errors.password && errors.password.message}
                                    </FormErrorMessage>
                                </FormControl>
                            </Flex>
                        </Flex>
                        <Flex w="full" direction="column" gap={6}>
                            <Text fontSize="lg" fontWeight="600" color="gray.600" letterSpacing="wide">2. Shipping Address</Text>
                            <Flex w="full" h="13rem" direction="row" gap={5}>
                                <Flex 
                                    w="80%" 
                                    direction="row" 
                                    gap={4}
                                    pl={3}
                                    alignItems="center"
                                    overflowX="scroll"
                                    overflowY="hidden"
                                    sx={{ 
                                        '&::-webkit-scrollbar': {
                                            height: '7px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: '#092654',
                                            borderRadius: '4px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            backgroundColor: '#f1f1f1',
                                        },
                                    }}
                                >
                                    {
                                        user?.addresses ? (
                                            sortedAddresses.map((address, index) => (
                                                <Flex as={NavLink} to={`/edit-address/${address}`} key={index} minW="16rem" minH="11rem" maxW="16rem" maxH="11rem" direction="column" gap={2} px={3} py={2} bg="white" rounded="md" shadow="md" cursor={"pointer"} transition="transform 0.2s" _hover={{ transform: 'scale(1.02)' }}>
                                                    <Flex w="full" gap={2}>
                                                        <Text 
                                                            fontSize="md" 
                                                            fontWeight="600" 
                                                            color="gray.700"
                                                            whiteSpace="nowrap"
                                                            overflow="hidden"  
                                                            textOverflow="ellipsis" 
                                                        >
                                                            {user.addresses[address].name}
                                                        </Text>
                                                        {
                                                            user.addresses[address].isDefault ? (
                                                                <Badge alignSelf="center" colorScheme="green">Default</Badge>
                                                            ) : null
                                                        }
                                                    </Flex>
                                                    <Divider/>
                                                    <Text fontSize="sm" fontWeight="500" color="gray.500" noOfLines={4}>{user.addresses[address].address}</Text>
                                                </Flex>
                                            ))
                                        ) : (
                                            <Alert status="warning" variant="left-accent">
                                                <AlertIcon />
                                                <Text fontSize="sm" fontWeight="600" color="gray.600">You have not added any shipping address yet.</Text>
                                            </Alert>
                                        )
                                    }
                                </Flex>
                                <Flex w="20%" direction="row" alignItems="center">
                                    <FormControl>
                                        <Box
                                            h="11rem"
                                            rounded="lg"
                                            borderWidth="2px"
                                            border={"dashed"}
                                            borderColor={"gray.600"}
                                            p={4}
                                            textAlign="center"
                                            position={"relative"}
                                            cursor="pointer"
                                        >
                                            <Flex direction="column" justifyContent="center" alignItems="center" h="full" as={NavLink} to={"/add-address"}>
                                                <BsPinMap
                                                    size={32}
                                                    color={"gray.600"}
                                                />
                                                <Text mt={4} fontSize="sm" fontWeight="600" color={"gray.600"}>
                                                    Add New Address
                                                </Text>
                                            </Flex>
                                        </Box>
                                    </FormControl>               
                                </Flex>
                            </Flex>
                        </Flex>
                        <Flex w="full" direction="column" gap={4}>
                            <Text fontSize="lg" fontWeight="600" color="gray.600" letterSpacing="wide">3. Payment Method</Text>
                            <Flex w="full" h="13rem" direction="row" gap={5}>
                                <Flex 
                                    w="80%" 
                                    direction="row" 
                                    gap={5}
                                    pl={3}
                                    alignItems="center"
                                    overflowX="scroll"
                                    overflowY="hidden"
                                    sx={{ 
                                        '&::-webkit-scrollbar': {
                                            height: '7px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: '#092654',
                                            borderRadius: '4px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            backgroundColor: '#f1f1f1',
                                        },
                                    }}
                                >
                                    {
                                        user?.cards ? (
                                            cards !== null && Object.keys(cards).map((card, index) => (
                                                <Box as={NavLink} to={`/edit-card/${card}`} key={index} cursor={"pointer"} transition="transform 0.2s" _hover={{ transform: 'scale(1.05)' }}>
                                                    <Cards  
                                                        expiry={cards[card].expiry}
                                                        name={cards[card].name}
                                                        number={maskCardNumber(cards[card].number)}
                                                    />                            
                                                </Box>
                                            ))
                                        ) : (
                                            <Alert status="warning" variant="left-accent">
                                                <AlertIcon />
                                                <Text fontSize="sm" fontWeight="600" color="gray.600">You have not added any credit/debit cards yet.</Text>
                                            </Alert>
                                        )
                                    }
                                </Flex>
                                <Flex w="20%" direction="row" alignItems='center'>
                                    <FormControl>
                                        <Box
                                            h="11rem"
                                            rounded="lg"
                                            borderWidth="2px"
                                            border={"dashed"}
                                            borderColor={"gray.600"}
                                            p={4}
                                            textAlign="center"
                                            position={"relative"}
                                            cursor="pointer"
                                        >
                                            <Flex direction="column" justifyContent="center" alignItems="center" h="full" as={NavLink} to={"/add-card"}>
                                                <CiCreditCard1
                                                    size={32}
                                                    color={"gray.600"}
                                                />
                                                <Text mt={4} fontSize="sm" fontWeight="600" color={"gray.600"}>
                                                    Add New Credit/Debit Card
                                                </Text>
                                            </Flex>
                                        </Box>
                                    </FormControl>               
                                </Flex>
                            </Flex>
                        </Flex>
                    </Flex>                    
                </form>                
            </Flex>
            <Flex w="30%" h="39rem" direction="column" position="fixed" right="6">
                <Flex w="full" h="full" direction="column" bg="white" shadow="md" rounded="md" p={7} gap={4}>
                    <Flex w="full" direction="row" gap={8} alignItems="center">
                        <Avatar size="2xl" name={user?.name} src={imageSrc ? imageSrc : "/src/assets/images/Default_User_Profile_2.png"} />
                        <FormControl>
                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                Profile Picture 
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
                                p={2}
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
                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                    <Flex w="full" direction="column" gap={4}>
                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                Name
                            </FormLabel>
                            <InputGroup>
                                <InputLeftElement>
                                    <Text fontSize="md" fontWeight="600" color="gray.600"><FaRegUser /></Text>
                                </InputLeftElement>
                                <Input 
                                    variant="flushed"
                                    type="text"
                                    defaultValue={user.name}
                                    color="gray.900"
                                    size="md"
                                    isReadOnly
                                    w="full"
                                />
                            </InputGroup>
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                Email Address
                            </FormLabel>
                            <InputGroup>
                                <InputLeftElement>
                                    <Text fontSize="md" fontWeight="600" color="gray.600"><MdOutlineAlternateEmail /></Text>
                                </InputLeftElement>
                                <Input 
                                    variant="flushed"
                                    type="email"
                                    defaultValue={user.email}
                                    color="gray.900"
                                    size="md"
                                    isReadOnly
                                    w="full"
                                />
                            </InputGroup>
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                Contact Number
                            </FormLabel>
                            <InputGroup>
                                <InputLeftElement>
                                    <Text fontSize="md" fontWeight="600" color="gray.600">+60</Text>
                                </InputLeftElement>
                                <Input 
                                    variant="flushed"
                                    type="text"
                                    defaultValue={user.contact}
                                    color="gray.900"
                                    size="md"
                                    isReadOnly
                                    w="full"
                                />                                    
                            </InputGroup>
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                Gender
                            </FormLabel>
                            <InputGroup>
                                <InputLeftElement>
                                    <Text fontSize="md" fontWeight="600" color="gray.600">
                                        {user?.gender === "Male" && <TbGenderMale fontSize="md" fontWeight="600" color="gray.600" />}
                                        {user?.gender === "Female" && <TbGenderFemale fontSize="md" fontWeight="600" color="gray.600" />}
                                        {!user?.gender && <FaGenderless fontSize="md" fontWeight="600" color="gray.600" />}
                                    </Text>
                                </InputLeftElement>
                                <Input 
                                    variant="flushed"
                                    type="text"
                                    defaultValue={user?.gender}
                                    color="gray.900"
                                    size="md"
                                    isReadOnly
                                    w="full"
                                />                                    
                            </InputGroup>
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                Date of Birth
                            </FormLabel>
                            <InputGroup>
                                <InputLeftElement>
                                    <Text fontSize="md" fontWeight="600" color="gray.600"><MdDateRange /></Text>
                                </InputLeftElement>
                                <Input 
                                    variant="flushed"
                                    type="text"
                                    defaultValue={user?.date_of_birth}
                                    color="gray.900"
                                    size="md"
                                    isReadOnly
                                    w="full"
                                />
                            </InputGroup>
                        </FormControl>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    )
}

export default CustomerProfile;