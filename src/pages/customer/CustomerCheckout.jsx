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
    Badge,
    Alert,
    AlertIcon,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill, BsPinMap } from "react-icons/bs";
import { RxCross1, RxHeight, RxWidth, RxSize, RxDimensions } from "react-icons/rx";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline, IoCartOutline } from "react-icons/io5";
import { CiWarning, CiCreditCard1 } from "react-icons/ci";
import { GoSmiley } from "react-icons/go";
import { GrThreeD } from "react-icons/gr";
import { FaImage, FaRegFileImage } from "react-icons/fa6";
import { AiOutlineDash } from "react-icons/ai";
import { FaPlus, FaTrash, FaStar, FaStarHalf, FaMinus } from "react-icons/fa6";
import { FaRegUser } from "react-icons/fa";
import { MdOutlineInventory, MdOutlineTexture, MdOutlineAlternateEmail } from "react-icons/md";
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
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import { encrypt, decrypt } from 'n-krypta'
import { fetchAndActivate, getValue } from "firebase/remote-config";
import { remoteConfig } from "../../../api/firebase.js";

function CustomerCheckout() {
    const {
        handleSubmit,
        register,
        setValue,
        formState: {
            errors, isSubmitting
        }
    } = useForm();
    const { user } = useAuth();
    const [ selectedAddress, setSelectedAddress ] = useState(null);
    const [ selectedCard, setSelectedCard ] = useState(null);
    const [ cards, setCards ] = useState(null);
    const addresses = user.addresses;

    const defaultAddress = Object.keys(addresses).filter(addressKey => addresses[addressKey].isDefault);
    const nonDefaultAddresses = Object.keys(addresses).filter(addressKey => !addresses[addressKey].isDefault);

    const sortedAddresses = [...defaultAddress, ...nonDefaultAddresses];
    const furniture = useLocation();

    useEffect(() => {
        setValue("name", user.name);
        setValue("email", user.email);
        setValue("contact", user.contact);

        if (sortedAddresses.length > 0) {
            setSelectedAddress(sortedAddresses[0]);
        }

        fetchAndActivate(remoteConfig)
            .then(() => {
                const private_key = getValue(remoteConfig, 'private_key').asString();
                const decryptedCards = {};
                Object.keys(user?.cards).forEach(card => {
                    let decryptedNumber = decrypt(user?.cards[card].number, private_key);
                    let decryptedExpiry = decrypt(user?.cards[card].expiry, private_key);
                    let decryptedName = decrypt(user?.cards[card].name, private_key);
                    decryptedCards[card] = {
                        number: decryptedNumber,
                        expiry: decryptedExpiry,
                        name: decryptedName,
                    }
                });
                setCards(decryptedCards);
            })
    }, [user]);

    const handleAddressSelection = (address) => {
        setSelectedAddress(address);
    };

    const handleCardSelection = (card) => {
        setSelectedCard(card);
    };

    const maskCardNumber = (number) => {
        const visibleDigits = 4;
        const masked = number.slice(0, visibleDigits) + "*".repeat(number.length - 8) + number.slice(-visibleDigits);
        return masked;
    };

    const PriceTemplate = (rowData) => {
        let discountedPrice = 0.0;
        const discount = Number(rowData.discount);
        const price = Number(rowData.price);
        if (discount > 0) {
            discountedPrice = price - (price * discount / 100);
        }
        
        const hasDecimal = (price % 1 !== 0) || (discountedPrice % 1 !== 0);

        return (
            <Flex direction="row" gap={2} >
                {
                    Number(rowData.discount) > 0 ? (
                        <Flex w="full" direction="column">
                            <Flex direction="row" gap={2}>
                                <Flex direction="row" gap={2}>
                                    <Text fontWeight={600} color={"green"}>RM</Text>
                                    <Text fontWeight="600" color="gray.600" letterSpacing="wide">{discountedPrice.toFixed(hasDecimal ? 2 : 0)}</Text>                
                                </Flex>                            
                                <Text fontWeight={600} color={"red"} textDecoration="line-through" letterSpacing="wide">{Number(rowData.price).toFixed(hasDecimal ? 2 : 0)}</Text>                                
                            </Flex>   
                            <Text fontSize="sm" color="#d69511" fontWeight="600" letterSpacing="wide">-{rowData.discount}% Discount</Text>                         
                        </Flex>

                    ) : (
                        <Flex direction="row" gap={2}>
                            <Text fontWeight={600} color={"green"}>RM</Text>
                            <Text fontWeight="600" color="gray.600" letterSpacing="wide">{Number(rowData.price).toFixed(hasDecimal ? 2 : 0)}</Text>                
                        </Flex>                        
                    )
                }
            </Flex>
        );
    };

    const toast = useToast();

    return (
        <Flex w="full" minH="full" p={4} gap={7} bg="#f4f4f4" direction="column" alignItems="center">
            <Flex w="full" minH="full" direction="row">
                <Flex w="70%" direction="column" gap={10} px={8}>
                    <Flex w="full" direction="row" alignItems="center" gap={4}>
                        <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                        <Text fontSize="2xl" fontWeight="700" color="#d69511">Checkout</Text>  
                    </Flex> 
                    <form action="/api/checkout" method="post" encType="multipart/form-data">
                        <Flex w="full" direction="column" gap={8}>
                            <Flex w="full" direction="column" gap={6}>
                                <Text fontSize="lg" fontWeight="600" color="gray.600" letterSpacing="wide">1. Contact Information</Text>
                                <Flex w="full" direction="row" gap={4}>
                                    <FormControl id="name">
                                        <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Name</FormLabel>
                                        <InputGroup>
                                            <InputLeftAddon>
                                                <Text fontSize="md" fontWeight="600" color="gray.600"><FaRegUser /></Text>
                                            </InputLeftAddon>
                                            <Input 
                                                variant="outline"
                                                defaultValue={user.name}
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                                isReadOnly
                                                p={2.5}
                                            />
                                        </InputGroup>
                                    </FormControl>
                                    <FormControl id="email">
                                        <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Email Address</FormLabel>
                                        <InputGroup>
                                            <InputLeftAddon>
                                                <Text fontSize="md" fontWeight="600" color="gray.600"><MdOutlineAlternateEmail /></Text>
                                            </InputLeftAddon>
                                            <Input 
                                                variant="outline"
                                                defaultValue={user.email}
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                                isReadOnly
                                                p={2.5}
                                            />
                                        </InputGroup>
                                    </FormControl>
                                    <FormControl id="contact">
                                        <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Contact Number</FormLabel>
                                        <InputGroup>
                                            <InputLeftAddon>
                                                <Text fontSize="md" fontWeight="600" color="gray.600">+60</Text>
                                            </InputLeftAddon>
                                            <Input 
                                                variant="outline"
                                                defaultValue={user.contact}
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                                isReadOnly
                                                p={2.5}
                                            />                                    
                                        </InputGroup>
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
                                                    <Flex 
                                                        key={index} 
                                                        minW="16rem" 
                                                        minH="11rem" 
                                                        maxW="16rem" 
                                                        maxH="11rem" 
                                                        direction="column" 
                                                        gap={2} 
                                                        px={3} 
                                                        py={2} 
                                                        bg="white" 
                                                        rounded="md" 
                                                        shadow="md" 
                                                        cursor={"pointer"}
                                                        transition="transform 0.2s" 
                                                        _hover={{ transform: 'scale(1.02)' }} 
                                                        outline={ selectedAddress ==  address ? "2px solid blue" : "none"}
                                                        onClick={() => handleAddressSelection(address)}
                                                    >
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
                                                    <Box 
                                                        key={index} 
                                                        rounded="xl"
                                                        cursor={"pointer"} 
                                                        transition="transform 0.2s" 
                                                        _hover={{ transform: 'scale(1.05)' }}
                                                        outline={ selectedCard ==  card ? "2px solid blue" : "none"}
                                                        onClick={() => handleCardSelection(card)}
                                                    >
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
                <Flex w="30%" direction="column">
                    <Flex w="full" bg="white" shadow="md" px={8} py={4} direction="column">
                        {
                            furniture.state.map((item, index) => (
                                <Flex key={index} w="full" direction="row" alignItems="center">
                                    <Flex w="30%">
                                        <img src={item.image} alt={item.name} style={{ width: "100px", height: "100px", objectFit: "contain" }}/>
                                    </Flex>
                                    <Flex w="70%" direction="column" gap={2}>
                                        <Text fontSize="lg" fontWeight="700" letterSpacing="wide" color="#d69511">{item.name}</Text>
                                        <Flex w="full" direction="row" alignItems="center" justifyContent="space-between">
                                            <PriceTemplate {...item}/>
                                            <Text fontSize="md" fontWeight="600" color="gray.600">x {item.quantity}</Text>                                            
                                        </Flex>
                                    </Flex>
                                </Flex>
                            ))
                        }
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300" mb={4}/>  
                        <Flex w="full" direction="row" justifyContent="space-between" mb={2}>
                            <Text fontSize="sm" fontWeight="600" color="gray.500" letterSpacing="wide">Merchandise Subtotal</Text>
                            <Text fontSize="sm" fontWeight="600" color="gray.600" letterSpacing="wide">
                                RM {
                                    furniture.state.reduce((acc, item) => {
                                        if (item.inventory > 0) {
                                            if (item.discount > 0) {
                                                return acc + ((item.price - (item.price * item.discount / 100)) * item.quantity);
                                            } else {
                                                return acc + (item.price * item.quantity);
                                            }
                                        }
                                        return acc;
                                    }, 0).toFixed(2)
                                }
                            </Text>
                        </Flex>
                        <Flex w="full" direction="row" justifyContent="space-between">
                            <Text fontSize="sm" fontWeight="600" color="gray.500" letterSpacing="wide">Shipping Subtotal</Text>
                            <Text fontSize="sm" fontWeight="600" color="gray.600" letterSpacing="wide">
                                RM {
                                    furniture.state.reduce((acc, item) => {
                                        if (item.inventory > 0) {
                                            if (item.discount > 0) {
                                                return acc + ((item.price - (item.price * item.discount / 100)) * item.quantity);
                                            } else {
                                                return acc + (item.price * item.quantity);
                                            }
                                        }
                                        return acc;
                                    }, 0).toFixed(2)
                                }
                            </Text>
                        </Flex>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300" my={4}/>  
                        <Flex w="full" direction="row" justifyContent="space-between" mb={4}>
                            <Text fontSize="md" fontWeight="600" color="gray.600" letterSpacing="wide">Total Payment</Text>
                            <Text fontSize="md" fontWeight="600" color="gray.700" letterSpacing="wide">
                                RM {
                                    furniture.state.reduce((acc, item) => {
                                        if (item.inventory > 0) {
                                            if (item.discount > 0) {
                                                return acc + ((item.price - (item.price * item.discount / 100)) * item.quantity);
                                            } else {
                                                return acc + (item.price * item.quantity);
                                            }
                                        }
                                        return acc;
                                    }, 0).toFixed(2)
                                }
                            </Text>
                        </Flex>
                        <Button w="full" colorScheme="blue" mb={1}>Proceed To Payment</Button>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    )
}

export default CustomerCheckout;