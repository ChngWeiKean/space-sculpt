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
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    TabIndicator,
    HStack,
    useDisclosure,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Tooltip,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill, BsPinMap } from "react-icons/bs";
import { RxCross1, RxHeight, RxWidth, RxSize, RxDimensions } from "react-icons/rx";
import { BiLinkExternal } from "react-icons/bi";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline, IoCartOutline } from "react-icons/io5";
import { CiWarning, CiCreditCard1, CiDeliveryTruck } from "react-icons/ci";
import { GoSmiley } from "react-icons/go";
import { BsCash } from "react-icons/bs";
import { SiCashapp } from "react-icons/si";
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
import { DirectionsRenderer, GoogleMap, InfoWindow, Marker } from '@react-google-maps/api';

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
    const [ selectedAddressData, setSelectedAddressData ] = useState(null);
    const [ directions, setDirections ] = useState(null);
    const [ duration, setDuration ] = useState(null);
    const [ shopAddressData, setShopAddressData ] = useState(null);
    const [ distanceFromShop, setDistanceFromShop ] = useState(null);
    const [ settings, setSettings ] = useState(null);
    const [ selectedCard, setSelectedCard ] = useState(null);
    const [ selectedCashPayment, setSelectedCashPayment ] = useState(false);
    const [ selectedVoucher, setSelectedVoucher ] = useState(null);
    const [ subtotal, setSubtotal ] = useState(0);
    const [ shippingFee, setShippingFee ] = useState(0);
    const [ weightFee, setWeightFee ] = useState(0);
    const [ total, setTotal ] = useState(0);
    const [ selectedEWallet, setSelectedEWallet ] = useState(false);
    const [ cards, setCards ] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const addresses = user.addresses;
    const mapStyle = {
		height: '575px',
		width: '100%',
	};
	const libs = ["places"];
	const [ mapRef, setMapRef ] = useState(null);
	const [ center, setCenter ] = useState({
		lat: 5.4164,
		lng: 100.3327,
	});

    const defaultAddress = Object.keys(addresses).filter(addressKey => addresses[addressKey].isDefault);
    const nonDefaultAddresses = Object.keys(addresses).filter(addressKey => !addresses[addressKey].isDefault);
    const { isOpen: isOpenCardsModal, onOpen: onOpenCardsModal, onClose: onCloseCardsModal } = useDisclosure();
    const { isOpen: isOpenVouchersModal, onOpen: onOpenVouchersModal, onClose: onCloseVouchersModal } = useDisclosure();

    const handleOpenCardsModal = () => {
        onOpenCardsModal();
    };

    const handleCloseCardsModal = () => {
        onCloseCardsModal();
    };

    const handleOpenVouchersModal = () => {
        onOpenVouchersModal();
    };

    const handleCloseVouchersModal = () => {
        onCloseVouchersModal();
    };

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

        const settingsRef = ref(db, `settings`);
        onValue(settingsRef, (snapshot) => {
            const data = snapshot.val();
            setSettings(data);
        });
    }, [user]);

    useEffect(() => {
        if (selectedAddress && settings) {
            const userAddress = user.addresses[selectedAddress];
            const shopAddress = settings.address;
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));
            service.getDetails({
                placeId: userAddress.place_id
            }, (userPlace, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    service.getDetails({
                        placeId: shopAddress.place_id
                    }, (shopPlace, status) => {
                        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                            let addressResult = {
                                name: userPlace.name,
                                address: userPlace.formatted_address,
                                place_id: userPlace.place_id,
                                lat: userPlace.geometry.location.lat(),
                                lng: userPlace.geometry.location.lng(),
                            };
                            setSelectedAddressData(addressResult);
                            let shopResult = {
                                name: shopPlace.name,
                                address: shopPlace.formatted_address,
                                place_id: shopPlace.place_id,
                                lat: shopPlace.geometry.location.lat(),
                                lng: shopPlace.geometry.location.lng(),
                            };
                            setShopAddressData(shopResult);
                            const userLocation = new window.google.maps.LatLng(userPlace.geometry.location.lat(), userPlace.geometry.location.lng());
                            const shopLocation = new window.google.maps.LatLng(shopPlace.geometry.location.lat(), shopPlace.geometry.location.lng());
                            const directionsService = new window.google.maps.DirectionsService();
                            directionsService.route({
                                origin: userLocation,
                                destination: shopLocation,
                                travelMode: window.google.maps.TravelMode.DRIVING
                            }, (response, status) => {
                                if (status === window.google.maps.DirectionsStatus.OK) {
                                    setDirections(response);
                                    setDuration(response.routes[0].legs[0].duration.text);
                                    setDistanceFromShop(response.routes[0].legs[0].distance.value / 1000);
                                    console.log(response.routes[0].legs[0].distance.value / 1000);
                                }
                            });
                        }
                    });
                }
            });
        }
    }, [settings, selectedAddress]);

    useEffect(() => {
        const calculateSubtotal = () => {
            return new Promise((resolve) => {
                const subtotal = furniture.state.reduce((acc, item) => {
                    if (item.inventory > 0) {
                        if (item.discount > 0) {
                            return acc + ((item.price - (item.price * item.discount / 100)) * item.quantity);
                        } else {
                            return acc + (item.price * item.quantity);
                        }
                    }
                    return acc;
                }, 0).toFixed(2);
                setSubtotal(subtotal);
                resolve(subtotal);
            });
        };
    
        const calculateShippingFee = (subtotal) => {
            return new Promise((resolve) => {
                let shipping = settings?.standard_shipping_fee;
                if (Number(subtotal) > settings?.shipping_fee_threshold) {
                    shipping = 0;
                } else {
                    shipping = distanceFromShop > Number(settings?.distance_threshold_for_standard_delivery_fee) ?
                        (Number(settings?.standard_shipping_fee) + ((distanceFromShop - Number(settings?.distance_threshold_for_standard_delivery_fee)) * Number(settings?.extra_delivery_charges_per_kilometer))).toFixed(2) :
                        settings?.standard_shipping_fee;
                }
                setShippingFee(shipping);
                resolve(shipping);
            });
        };
    
        const calculateWeightFee = () => {
            return new Promise((resolve) => {
                const weight = Object.values(furniture.state).reduce((acc, item) => {
                    return acc + Number(item.weight);
                }, 0);
            
                if (weight > settings?.maximum_weight_load) {
                    const weightCharges = ((weight - Number(settings?.maximum_weight_load)) * Number(settings?.extra_weight_fee_per_kilogram)).toFixed(2);
                    setWeightFee(weightCharges);
                } else {
                    setWeightFee(0); 
                }
                resolve(weight);
            });
        };

        Promise.all([
            calculateSubtotal(),
            calculateWeightFee()
        ]).then(([subtotal, weight]) => {
            calculateShippingFee(subtotal).then((shipping) => {
                const total = (Number(subtotal) + Number(shipping) + Number(weight)).toFixed(2);
                setTotal(total);
                setLoading(false);
            });
        });
    }, [furniture.state, distanceFromShop]);

    const handleAddressSelection = (address) => {
        setSelectedAddress(address);
    };

    const handleCardSelection = (card) => {
        setSelectedCard(card);
        setSelectedCashPayment(false);
        setSelectedEWallet(false);
    };

    const handleCashOnDeliverySelection = () => {
        setSelectedCashPayment(true);
        setSelectedCard(null);
        setSelectedEWallet(false);
    }

    const handleEWalletSelection = () => {
        setSelectedEWallet(true);
        setSelectedCard(null);
        setSelectedCashPayment(false);
    }

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
        <Flex w="full" minH="full" bg="#f4f4f4" direction="column" alignItems="center">
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
            <Flex w="full" minH="full" direction="column">
                <Flex w="full" minH="full" direction="row" p={4}>
                    <Flex w="70%" direction="column" gap={6} px={8}>
                        <Flex w="full" direction="column">
                            <Flex w="full" direction="row" alignItems="center" gap={4} mb={2}>
                                <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                                <Text fontSize="2xl" fontWeight="700" color="#d69511">Checkout</Text>  
                            </Flex> 
                            {
                                shippingFee == 0 && (
                                    <Flex w="full" direction="row">
                                        <Alert status="success" size={"lg"}>
                                            <AlertIcon />
                                            <Text fontSize="sm" fontWeight="semibold">
                                                Free Shipping for orders above RM {settings?.shipping_fee_threshold}
                                            </Text>
                                        </Alert>
                                    </Flex>
                                )
                            }
                            {
                                weightFee > 0 && (
                                    <Flex w="full" direction="row">
                                        <Alert status="warning" size={"lg"}>
                                            <AlertIcon />
                                            <Text fontSize="sm" fontWeight="semibold">
                                                Additional weight charges of RM {weightFee} apply for orders exceeding {settings?.maximum_weight_load}kg
                                            </Text>
                                        </Alert>
                                    </Flex>
                                )
                            }
                        </Flex>
                        <form action="/api/checkout" method="post" encType="multipart/form-data">
                            <Flex w="full" direction="column" gap={4}>
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
                                    <Text fontSize="lg" fontWeight="600" color="gray.600" letterSpacing="wide">3. Vouchers</Text>
                                    <Flex w="full" h="13rem" direction="row" gap={5}>
                                        <Flex 
                                            w="full" 
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
                                            <Flex 
                                                minW="16rem" 
                                                minH="10rem" 
                                                maxW="16rem" 
                                                maxH="10rem" 
                                                direction="column" 
                                                gap={2} 
                                                px={6}
                                                py={2}
                                                roundedRight="md" 
                                                cursor={"pointer"}
                                                transition="transform 0.2s" 
                                                _hover={{ transform: 'scale(1.05)' }} 
                                                style={{
                                                    background: 'linear-gradient(135deg, #7ed3d6, #7ed687)',
                                                    position: 'relative', 
                                                    padding: '1rem'
                                                }}
                                            >
                                                <Box
                                                    position="absolute"
                                                    top="0"
                                                    left="35%"
                                                    transform="translateX(-50%)"
                                                    width="2px"
                                                    height="100%"
                                                    backgroundImage="linear-gradient(#f4f4f4 50%, transparent 50%)" 
                                                    backgroundSize="4px 10px"
                                                    backgroundRepeat="repeat-y" 
                                                    zIndex="1" 
                                                />

                                                {[...Array(9)].map((_, index) => (
                                                    <Box
                                                        my={1}
                                                        key={index}
                                                        position="absolute"
                                                        top={`${(index * 20) + 5}px`} 
                                                        left="0%" 
                                                        transform="translate(-50%, -50%)"
                                                        width="10px"
                                                        height="10px"
                                                        borderLeftRadius="50%"
                                                        borderRightRadius="50%"
                                                        bg="#f4f4f4"
                                                        zIndex="2"
                                                    />
                                                ))}                                           

                                                <Box
                                                    position="absolute"
                                                    top="0"
                                                    left="35%"
                                                    transform="translate(-50%, -50%)"
                                                    width="15px"
                                                    height="15px"
                                                    borderBottomLeftRadius="50%"
                                                    borderBottomRightRadius="50%"
                                                    bg="#f4f4f4"
                                                    zIndex="2"
                                                />
                                                <Box
                                                    position="absolute"
                                                    bottom="0"
                                                    left="35%"
                                                    transform="translate(-50%, 50%)"
                                                    width="15px"
                                                    height="15px"
                                                    borderTopLeftRadius="50%"
                                                    borderTopRightRadius="50%"
                                                    bg="#f4f4f4"
                                                    zIndex="2"
                                                />

                                                <Flex direction="column" h="full" gap={1}>
                                                    <Flex w="full" justifyContent="space-between" alignItems="center">
                                                        <SiCashapp
                                                            size={32}
                                                            color={"#2862bf"}
                                                        />                 
                                                        <Text fontSize="3xl" fontWeight="800" color={"#2862bf"}>RM</Text>                                   
                                                    </Flex>
                                                    <Flex w="full" justifyContent="center" alignItems="center" gap={3}>
                                                        <Text mt={4} fontSize="lg" fontWeight="600" color={"#2862bf"} letterSpacing="wide">
                                                            Cash On Delivery
                                                        </Text>                                                    
                                                    </Flex>
                                                </Flex>
                                            </Flex> 
                                        </Flex>
                                    </Flex>
                                </Flex>
                                <Flex w="full" direction="column" gap={4}>
                                    <Text fontSize="lg" fontWeight="600" color="gray.600" letterSpacing="wide">4. Payment Method</Text>
                                    <Flex w="full" h="13rem" direction="row" gap={5}>
                                        <Flex 
                                            w="full" 
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
                                            {total > Number(settings?.cash_on_delivery_threshold) ? (
                                                <Flex 
                                                    minW="16rem" 
                                                    minH="10rem" 
                                                    maxW="16rem" 
                                                    maxH="10rem" 
                                                    direction="column" 
                                                    gap={2} 
                                                    px={6}
                                                    py={2}
                                                    rounded="xl" 
                                                    shadow="md" 
                                                    cursor={"pointer"}
                                                    transition="transform 0.2s" 
                                                    _hover={total <= Number(settings?.cash_on_delivery_threshold) ? { transform: 'scale(1.05)' } : null}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                                                        opacity: total > Number(settings?.cash_on_delivery_threshold) ? 0.6 : 1,
                                                    }}
                                                    outline={ selectedCashPayment ? "2px solid blue" : "none"}
                                                    onClick={total <= Number(settings?.cash_on_delivery_threshold) ? () => handleCashOnDeliverySelection() : null}
                                                >
                                                    <Tooltip label={`Total exceeds threshold of RM${Number(settings?.cash_on_delivery_threshold)}`} placement="top">
                                                        <Flex direction="column" h="full" gap={1}>
                                                            <Flex w="full" justifyContent="space-between" alignItems="center">
                                                                <SiCashapp
                                                                    size={32}
                                                                    color={"#2862bf"}
                                                                />                 
                                                                <Text fontSize="3xl" fontWeight="800" color={"#2862bf"}>RM</Text>                                   
                                                            </Flex>
                                                            <Flex w="full" justifyContent="center" alignItems="center" gap={3}>
                                                                <Text mt={4} fontSize="lg" fontWeight="600" color={"#2862bf"} letterSpacing="wide">
                                                                    Cash On Delivery
                                                                </Text>                                                    
                                                            </Flex>
                                                        </Flex>
                                                    </Tooltip>
                                                </Flex>
                                            ) : (
                                                <Flex 
                                                    minW="16rem" 
                                                    minH="10rem" 
                                                    maxW="16rem" 
                                                    maxH="10rem" 
                                                    direction="column" 
                                                    gap={2} 
                                                    px={6}
                                                    py={2}
                                                    rounded="xl" 
                                                    shadow="md" 
                                                    cursor={"pointer"}
                                                    transition="transform 0.2s" 
                                                    _hover={total <= Number(settings?.cash_on_delivery_threshold) ? { transform: 'scale(1.05)' } : null}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                                                        opacity: total > Number(settings?.cash_on_delivery_threshold) ? 0.6 : 1,
                                                    }}
                                                    outline={ selectedCashPayment ? "2px solid blue" : "none"}
                                                >
                                                    <Flex direction="column" h="full" gap={1}>
                                                        <Flex w="full" justifyContent="space-between" alignItems="center">
                                                            <SiCashapp
                                                                size={32}
                                                                color={"#2862bf"}
                                                            />                 
                                                            <Text fontSize="3xl" fontWeight="800" color={"#2862bf"}>RM</Text>                                   
                                                        </Flex>
                                                        <Flex w="full" justifyContent="center" alignItems="center" gap={3}>
                                                            <Text mt={4} fontSize="lg" fontWeight="600" color={"#2862bf"} letterSpacing="wide">
                                                                Cash On Delivery
                                                            </Text>                                                    
                                                        </Flex>
                                                    </Flex>
                                                </Flex>
                                            )}
                                            {total > Number(settings?.e_wallet_threshold) ? (
                                                <Flex 
                                                    minW="16rem" 
                                                    minH="10rem" 
                                                    maxW="16rem" 
                                                    maxH="10rem" 
                                                    direction="column" 
                                                    gap={2} 
                                                    px={6}
                                                    py={2}
                                                    rounded="xl" 
                                                    shadow="md" 
                                                    cursor={"pointer"}
                                                    justifyContent="center"
                                                    transition="transform 0.2s" 
                                                    _hover={total <= Number(settings?.e_wallet_threshold) ? { transform: 'scale(1.05)' } : null}
                                                    style={{
                                                        opacity: total > Number(settings?.e_wallet_threshold) ? 0.6 : 1,
                                                    }}
                                                    bg={"#295EA2"}
                                                    outline={ selectedEWallet ? "2px solid blue" : "none"}
                                                    onClick={total <= Number(settings?.e_wallet_threshold) ? () => handleEWalletSelection() : null}
                                                >
                                                    <Tooltip label={`Total exceeds threshold of RM${settings?.e_wallet_threshold}`} placement="top">
                                                        <Flex w="full" h="full" justifyContent="center">
                                                            <img src="/src/assets/images/touch_n_go.png" style={{ width: "180px" }}/>
                                                        </Flex>
                                                    </Tooltip>
                                                </Flex>
                                            ) : (
                                                <Flex 
                                                    minW="16rem" 
                                                    minH="10rem" 
                                                    maxW="16rem" 
                                                    maxH="10rem" 
                                                    direction="column" 
                                                    gap={2} 
                                                    px={6}
                                                    py={2}
                                                    rounded="xl" 
                                                    shadow="md" 
                                                    cursor={"pointer"}
                                                    justifyContent="center"
                                                    transition="transform 0.2s" 
                                                    _hover={total <= Number(settings?.e_wallet_threshold) ? { transform: 'scale(1.05)' } : null}
                                                    style={{
                                                        opacity: total > Number(settings?.e_wallet_threshold) ? 0.6 : 1,
                                                    }}
                                                    bg={"#295EA2"}
                                                    outline={ selectedEWallet ? "2px solid blue" : "none"}
                                                >
                                                    <Flex w="full" h="full" justifyContent="center">
                                                        <img src="/src/assets/images/touch_n_go.png" style={{ width: "180px" }}/>
                                                    </Flex>
                                                </Flex>
                                            )}
                                            {
                                                cards && Object.keys(cards).map((card, index) => (
                                                    selectedCard ? (
                                                        selectedCard === card && (
                                                            <Box 
                                                                key={index} 
                                                                rounded="xl"
                                                                cursor={"pointer"} 
                                                                transition="transform 0.2s" 
                                                                _hover={{ transform: 'scale(1.05)' }}
                                                                outline={ selectedCard === card ? "2px solid blue" : "none"}
                                                                onClick={(e) => {e.preventDefault(); handleOpenCardsModal()}}
                                                            >
                                                                <Cards  
                                                                    expiry={cards[selectedCard].expiry}
                                                                    name={cards[selectedCard].name}
                                                                    number={maskCardNumber(cards[selectedCard].number)}
                                                                />                            
                                                            </Box>                                                        
                                                        )

                                                    ) : (
                                                        index === 0 && (
                                                            <Box 
                                                                key={index} 
                                                                rounded="xl"
                                                                cursor={"pointer"} 
                                                                transition="transform 0.2s" 
                                                                _hover={{ transform: 'scale(1.05)' }}
                                                                outline={ selectedCard === card ? "2px solid blue" : "none"}
                                                                onClick={(e) => {e.preventDefault(); handleOpenCardsModal()}}
                                                            >
                                                                <Cards  
                                                                    expiry={cards[card].expiry}
                                                                    name={cards[card].name}
                                                                    number={maskCardNumber(cards[card].number)}
                                                                />                            
                                                            </Box>
                                                        )                                                    
                                                    )
                                                ))
                                            }
                                            {
                                                isOpenCardsModal && (
                                                    <Modal size='sm' isCentered isOpen={isOpenCardsModal} onClose={handleCloseCardsModal}>
                                                        <ModalOverlay bg='blackAlpha.300' />
                                                        <ModalContent>
                                                            <ModalCloseButton _focus={{
                                                                boxShadow: 'none',
                                                                outline: 'none',
                                                            }} />
                                                            <ModalBody>
                                                                {
                                                                    cards && Object.keys(cards).map((card, index) => (
                                                                        <Box 
                                                                            key={index} 
                                                                            rounded="xl"
                                                                            cursor={"pointer"} 
                                                                            transition="transform 0.2s" 
                                                                            _hover={{ transform: 'scale(1.05)' }}
                                                                            onClick={(e) => {e.preventDefault(); handleCardSelection(card); handleCloseCardsModal();}}
                                                                            my={6}
                                                                        >
                                                                            <Cards  
                                                                                expiry={cards[card].expiry}
                                                                                name={cards[card].name}
                                                                                number={maskCardNumber(cards[card].number)}
                                                                            />                            
                                                                        </Box>
                                                                    ))
                                                                }
                                                            </ModalBody>
                                                        </ModalContent>
                                                    </Modal>    
                                                )
                                            }
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </Flex>                        
                        </form>
                    </Flex>
                    <Flex w="30%" direction="column">
                        <Flex w="full" bg="white" shadow="md" p={1}>
                            <Tabs w="full" size="md" variant="unstyled">
                                <TabList>
                                    <Tab style={{ outline: "none" }}>Order List</Tab>
                                    <Tab style={{ outline: "none" }}>Delivery Distance</Tab>
                                </TabList>
                                <TabIndicator mt='-1.5px' height='2px' bg='blue.500' borderRadius='1px' />
                                <TabPanels>
                                    <TabPanel>
                                        <Flex direction="column">
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
                                                    RM { subtotal }
                                                </Text>
                                            </Flex>
                                            <Flex w="full" direction="row" justifyContent="space-between" mb={2}>
                                                <Text fontSize="sm" fontWeight="600" color="gray.500" letterSpacing="wide">Shipping Fee</Text>
                                                <Text fontSize="sm" fontWeight="600" color="gray.600" letterSpacing="wide">
                                                    RM { shippingFee }
                                                </Text>
                                            </Flex>
                                            {
                                                weightFee > 0 && (
                                                    <Flex w="full" direction="row" justifyContent="space-between" mb={2}>
                                                        <Text fontSize="sm" fontWeight="600" color="gray.500" letterSpacing="wide">Extra Weight Fee</Text>
                                                        <Text fontSize="sm" fontWeight="600" color="gray.600" letterSpacing="wide">
                                                            RM { weightFee }
                                                        </Text>
                                                    </Flex>                                                
                                                )
                                            }
                                            <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300" my={4}/>  
                                            <Flex w="full" direction="row" justifyContent="space-between" mb={4}>
                                                <Text fontSize="md" fontWeight="600" color="gray.600" letterSpacing="wide">Total Payment</Text>
                                                <Text fontSize="md" fontWeight="600" color="gray.700" letterSpacing="wide">
                                                    RM { (Number(subtotal) + Number(shippingFee) + Number(weightFee)).toFixed(2) }
                                                </Text>
                                            </Flex>
                                            <Button w="full" colorScheme="blue" mb={1}>Proceed To Payment</Button>
                                        </Flex>                                    
                                    </TabPanel>
                                    <TabPanel>
                                        <Flex direction="column" gap={3}>
                                            <GoogleMap
                                                onLoad={(map) => { setMapRef(map) }}
                                                center={center}
                                                zoom={15} 
                                                mapContainerStyle={mapStyle}
                                            >
                                                {selectedAddressData && (
                                                    <Marker
                                                        position={{ lat: selectedAddressData.lat, lng: selectedAddressData.lng }}
                                                    />
                                                )}
                                                {shopAddressData && (
                                                    <Marker
                                                        position={{ lat: shopAddressData.lat, lng: shopAddressData.lng }}
                                                    />
                                                )}
                                                {selectedAddressData && shopAddressData && directions && (
                                                    <DirectionsRenderer directions={directions} />
                                                )}
                                            </GoogleMap> 
                                            <Flex direction="column">
                                                <Flex w="full" direction="row" gap={2}>
                                                    <Text fontSize="sm" fontWeight="600" color="gray.600" letterSpacing="wide">Distance from Shop:</Text>
                                                    <Text fontSize="md" fontWeight="700" color="gray.700" letterSpacing="wide">{distanceFromShop} km</Text>
                                                </Flex>
                                                <Flex w="full" direction="row" gap={2}>
                                                    <Text fontSize="sm" fontWeight="600" color="gray.600" letterSpacing="wide">Estimated Driving Duration:</Text>
                                                    <Text fontSize="md" fontWeight="700" color="gray.700" letterSpacing="wide">{duration}</Text>
                                                </Flex>
                                            </Flex>
                                        </Flex>
                                    </TabPanel>
                                </TabPanels>
                            </Tabs>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    )
}

export default CustomerCheckout;