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
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill, BsPinMap, BsCart3 } from "react-icons/bs";
import { LiaShippingFastSolid } from "react-icons/lia";
import { RxCross1, RxHeight, RxWidth, RxSize, RxDimensions } from "react-icons/rx";
import { BiLinkExternal } from "react-icons/bi";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline, IoCartOutline } from "react-icons/io5";
import { CiWarning, CiCreditCard1, CiDeliveryTruck } from "react-icons/ci";
import { GoSmiley } from "react-icons/go";
import { BsCash } from "react-icons/bs";
import { SiCashapp } from "react-icons/si";
import { RiCoupon3Line, RiCoupon2Fill } from "react-icons/ri";
import { GrThreeD } from "react-icons/gr";
import { FaImage, FaRegFileImage } from "react-icons/fa6";
import { AiOutlineDash } from "react-icons/ai";
import { FaPlus, FaTrash, FaStar, FaStarHalf, FaMinus } from "react-icons/fa6";
import { FaRegUser } from "react-icons/fa";
import { MdOutlineInventory, MdOutlineTexture, MdOutlineAlternateEmail } from "react-icons/md";
import { Form, useForm } from "react-hook-form";
import { NavLink, useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../../components/AuthCtx.jsx";
import { db } from "../../../api/firebase";
import { onValue, ref, query, orderByChild, equalTo, set } from "firebase/database";
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import { encrypt, decrypt } from 'n-krypta'
import { fetchAndActivate, getValue } from "firebase/remote-config";
import { remoteConfig } from "../../../api/firebase.js";
import { DirectionsRenderer, GoogleMap, InfoWindow, Marker } from '@react-google-maps/api';

function CustomerPaymentAndPlaceOrder() {
    const { user } = useAuth();
    const toast = useToast();
    const [ card, setCard ] = useState(null);
    const order = useLocation().state;
    console.log(order);
    const {
        handleSubmit,
        register,
        setValue,
        formState: {
            errors, isSubmitting
        },
        watch
    } = useForm();

    useEffect(() => {
        if (order.payment === "card") {
            console.log("MEOW MEOW");
            const userCard = user.cards[order.payment_method];
            console.log(userCard);
            fetchAndActivate(remoteConfig)
                .then(() => {
                    const private_key = getValue(remoteConfig, 'private_key').asString();
                    let decryptedNumber = decrypt(userCard.number, private_key);
                    let decryptedExpiry = decrypt(userCard.expiry, private_key);
                    let decryptedName = decrypt(userCard.name, private_key);
                    setCard({
                        number: decryptedNumber,
                        expiry: decryptedExpiry,
                        name: decryptedName,
                    });
                })
        }
    }, [order, user]); 

    const maskCardNumber = (number) => {
        if (!number) return "";

        const visibleDigits = 4;
        const masked = number?.slice(0, visibleDigits) + "*".repeat(number?.length - 8) + number?.slice(-visibleDigits);
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

    const placeOrder = async () => {
        let data = {
            user_id: order.user,
            items: order.items,
            address: order.address,
            payment: order.payment,
            payment_method: order.payment_method,
            subtotal: order.subtotal,
            shipping: order.shipping,
            weight: order.weight,
            discount: order.discount,
            voucher: order.voucher,
            total: order.total,
        };
        console.log(data);

    }

    return (
        <Flex w="full" minH="full" bg="#f4f4f4" direction="column" alignItems="center">
            <Flex w="full" minH="full" direction="column">
                <Flex w="full" minH="full" direction="row" p={4}>
                    <Flex w="70%" direction="column" gap={4} px={8}>
                        <Flex w="full" direction="column">
                            <Flex w="full" direction="row" alignItems="center" gap={4} mb={2}>
                                <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                                <Text fontSize="2xl" fontWeight="700" color="#d69511">Confirm Order</Text>  
                            </Flex> 
                        </Flex>
                        <form action="/api/checkout" method="post" encType="multipart/form-data">
                            <Flex w="full" direction="column" gap={8}>
                                <Flex w="full" direction="column" gap={4}>
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

                                <Flex w="full" direction="column" gap={2}>
                                    <Text fontSize="lg" fontWeight="600" color="gray.600" letterSpacing="wide">2. Shipping Address</Text>
                                    <Flex w="full" direction="row" gap={4}>
                                        <FormControl id="address">
                                            <Textarea 
                                                variant="outline"
                                                defaultValue={order.address.address}
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
                                        </FormControl>
                                    </Flex>
                                </Flex>

                                <Flex w="full" direction="row">
                                    <Flex w="full" direction="column">
                                        <Text fontSize="lg" fontWeight="600" color="gray.600" letterSpacing="wide">3. Vouchers</Text>
                                        <Flex w="full" h={order.voucher ? "13rem" : "3rem"} direction="row">
                                            {
                                                order.voucher ? (
                                                    <Flex 
                                                        w="full" 
                                                        direction="row" 
                                                        gap={5}
                                                        pl={3}
                                                        alignItems="center"
                                                    >
                                                        <Flex 
                                                            minW="23rem" 
                                                            minH="10rem" 
                                                            maxW="23rem" 
                                                            maxH="10rem" 
                                                            direction="column" 
                                                            gap={2} 
                                                            px={6}
                                                            py={2}
                                                            roundedRight="md" 
                                                            cursor={"pointer"}
                                                            style={{
                                                                background: "linear-gradient(135deg, #7ed3d6, #7ed687)",
                                                                position: 'relative', 
                                                                padding: '1rem'
                                                            }}
                                                        >
                                                            {[...Array(9)].map((_, index) => (
                                                                <Box
                                                                    my={2}
                                                                    key={index}
                                                                    position="absolute"
                                                                    top={`${(index * 20) + 2}px`} 
                                                                    left="0%" 
                                                                    transform="translate(-50%, -50%)"
                                                                    width="12px"
                                                                    height="12px"
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
                                                                transform="translateX(-50%)"
                                                                width="4px"
                                                                height="100%"
                                                                backgroundImage="linear-gradient(#f4f4f4 50%, transparent 50%)" 
                                                                backgroundSize="4px 20px"
                                                                backgroundRepeat="repeat-y" 
                                                                zIndex="1" 
                                                            />
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
                                                            <Flex w="full" h="8rem">
                                                                <Flex w="35%" h="8rem" alignItems="center" justifyContent="center">
                                                                    {
                                                                        order.voucher?.discount_application === "products" && (
                                                                            <BsCart3 size="70px" color="#f4f4f4"/>
                                                                        ) 
                                                                    }
                                                                    {
                                                                        order.voucher?.discount_application === "shipping" && (
                                                                            <LiaShippingFastSolid size="70px" color="#f4f4f4"/>
                                                                        )
                                                                    }
                                                                </Flex>
                                                                <Flex w="65%" h="8rem" direction="column" justifyContent="center" gap={2} ml={10}>
                                                                    <Flex w="full" gap={3} direction="row">
                                                                        {
                                                                            order.voucher?.discount_type === "fixed" && (
                                                                                <Text fontSize="5xl" fontWeight="600" color="#f4f4f4">RM</Text>
                                                                            )
                                                                        }                                             
                                                                        {
                                                                            order.voucher?.discount_value && (
                                                                                <Text fontSize="5xl" fontWeight="600" color="#f4f4f4">{order.voucher?.discount_value}</Text>
                                                                            )
                                                                        }            
                                                                        {
                                                                            order.voucher?.discount_type === "percentage" && (
                                                                                <Text fontSize="5xl" fontWeight="600" color="#f4f4f4">%</Text>
                                                                            )
                                                                        }
                                                                        {
                                                                            !order.voucher?.discount_value && !order.voucher?.discount_type && (
                                                                                <Text fontSize="5xl" fontWeight="600" color="#f4f4f4">0</Text>
                                                                            )
                                                                        }             
                                                                    </Flex>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="600" color="#f4f4f4">Minimum Spend RM{order.voucher.minimum_spend}</Text>
                                                                        <Text fontSize="sm" fontWeight="500" color="#f4f4f4">Expiries In {order.voucher.expiry_date}</Text>
                                                                    </Flex>
                                                                </Flex>
                                                            </Flex>
                                                        </Flex> 
                                                    </Flex>
                                                ) : (
                                                    <Flex w="full" h="3rem" direction="row" alignItems="center">
                                                        <Text fontSize="lg" fontWeight="600" color="gray.500" letterSpacing="wide">No Voucher Applied</Text>
                                                    </Flex>
                                                )
                                            }
                                        </Flex>
                                    </Flex>    
                                    <Flex w="full" direction="column">
                                        <Text fontSize="lg" fontWeight="600" color="gray.600" letterSpacing="wide">4. Payment Method</Text>
                                        <Flex w="full" h="13rem" direction="row" gap={5}>
                                            <Flex 
                                                w="full" 
                                                direction="row" 
                                                gap={5}
                                                pl={3}
                                                alignItems="center"
                                            >
                                                {order.payment === "cash" && (
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
                                                        style={{
                                                            background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                                                        }}
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
                                                {order.payment === "ewallet" && (
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
                                                        bg={"#295EA2"}
                                                    >
                                                        <Flex w="full" h="full" justifyContent="center">
                                                            <img src="/src/assets/images/touch_n_go.png" style={{ width: "180px" }}/>
                                                        </Flex>
                                                    </Flex>
                                                )}
                                                {
                                                    card && (
                                                        <Box 
                                                            rounded="xl"
                                                            cursor={"pointer"} 
                                                        >
                                                            <Cards  
                                                                expiry={card.expiry}
                                                                name={card.name}
                                                                number={maskCardNumber(card.number)}
                                                            />                            
                                                        </Box>                                               
                                                    )
                                                }
                                            </Flex>
                                        </Flex>
                                    </Flex>                                
                                </Flex>
                            </Flex>
                        </form>
                    </Flex>
                    <Flex w="30%" direction="column">
                        <Flex w="full" bg="white" shadow="md" p={4} direction="column">
                            <Flex direction="column">
                                {
                                    order.items.map((item, index) => (
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
                                        RM { order.subtotal }
                                    </Text>
                                </Flex>
                                <Flex w="full" direction="row" justifyContent="space-between" mb={2}>
                                    <Text fontSize="sm" fontWeight="600" color="gray.500" letterSpacing="wide">Shipping Fee</Text>
                                    <Text fontSize="sm" fontWeight="600" color="gray.600" letterSpacing="wide">
                                        RM { order.shipping }
                                    </Text>
                                </Flex>
                                {
                                    order.weight > 0 && (
                                        <Flex w="full" direction="row" justifyContent="space-between" mb={2}>
                                            <Text fontSize="sm" fontWeight="600" color="gray.500" letterSpacing="wide">Extra Weight Fee</Text>
                                            <Text fontSize="sm" fontWeight="600" color="gray.600" letterSpacing="wide">
                                                RM { order.weight }
                                            </Text>
                                        </Flex>                                                
                                    )
                                }
                                {
                                    order.voucher && (
                                        <Flex w="full" direction="row" justifyContent="space-between" mb={2}>
                                            <Text fontSize="sm" fontWeight="600" color="gray.500" letterSpacing="wide">Voucher Discount</Text>
                                            <Text fontSize="sm" fontWeight="600" color="gray.600" letterSpacing="wide">
                                                - RM { order.discount }
                                            </Text>
                                        </Flex>                                                
                                    )
                                }
                                <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300" my={4}/>  
                                <Flex w="full" direction="row" justifyContent="space-between" mb={4}>
                                    <Text fontSize="md" fontWeight="600" color="gray.600" letterSpacing="wide">Total Payment</Text>
                                    <Text fontSize="md" fontWeight="600" color="gray.700" letterSpacing="wide">
                                        RM { order.total }
                                    </Text>
                                </Flex>
                                <Button w="full" colorScheme="blue" mb={1} style={{ outline:'none' }} onClick={() => placeOrder()}>Place Order</Button>
                            </Flex>                                    
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
}

export default CustomerPaymentAndPlaceOrder;