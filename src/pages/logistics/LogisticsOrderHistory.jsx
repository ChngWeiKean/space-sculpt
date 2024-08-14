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
import { CiWarning, CiCreditCard1, CiDeliveryTruck, CiUser, CiPhone } from "react-icons/ci";
import { GoSmiley } from "react-icons/go";
import { TbTruckDelivery } from "react-icons/tb";
import { GoDotFill } from "react-icons/go";
import { RiContactsLine } from "react-icons/ri";
import { BsCash, BsCalendar2Date } from "react-icons/bs";
import { TbMoneybag } from "react-icons/tb";
import { CiDiscount1 } from "react-icons/ci";
import { FaCar } from "react-icons/fa";
import { CiCreditCard2 } from "react-icons/ci";
import { IoTimeOutline } from "react-icons/io5";
import { SiCashapp } from "react-icons/si";
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
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function LogisticsOrderHistory() {
    const [ pendingOrders, setPendingOrders ] = useState([]);
    const [ orderHistory, setOrderHistory ] = useState([]);
    const [ reports, setReports ] = useState([]);
    const [ deliveryDrivers, setDeliveryDrivers ] = useState([]);

    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false
    };

    useEffect(() => {
        const orderRef = ref(db, 'orders');
        const userRef = ref(db, 'users');

        onValue(orderRef, async (snapshot) => {
            let newPendingOrders = [];
            let newOrderHistory = [];
            let newReports = [];
            const orderPromises = [];

            if (!snapshot.exists()) {
                return;
            }

            snapshot.forEach((orderSnapshot) => {
                const order = orderSnapshot.val();

                const date = new Date(order.created_on);
                const formattedDate = date.getDate() + " " + date.toLocaleString('default', { month: 'long' }) + " " + date.getFullYear();
                const shippingDate = new Date(order.shipping_date);
                const formattedShippingDate = shippingDate.getDate() + " " + shippingDate.toLocaleString('default', { month: 'long' }) + " " + shippingDate.getFullYear();

                order.created_on = formattedDate;
                order.shipping_date = formattedShippingDate;
                order.id = orderSnapshot.key;

                const userPromise = new Promise((resolve) => {
                    const userQuery = query(userRef, orderByChild('uid'), equalTo(order.user_id));
                    onValue(userQuery, (userSnapshot) => {
                        userSnapshot.forEach((userChildSnapshot) => {
                            const user = userChildSnapshot.val();
                            order.user = user;
                        });
                        resolve(order);
                    });
                });

                orderPromises.push(userPromise);
            });

            const orders = await Promise.all(orderPromises);

            orders.forEach((order) => {
                if (!order.completion_status.Completed && !order.completion_status.OnHold) {
                    newPendingOrders.push(order);
                } else if (order.completion_status.OnHold) {
                    newReports.push(order);
                } else {
                    newOrderHistory.push(order);
                }
            });

            setPendingOrders(newPendingOrders);
            setOrderHistory(newOrderHistory);
            setReports(newReports);
        });
    }, []);

    useEffect(() => {
        const userRef = ref(db, 'users');
        const userQuery = query(userRef, orderByChild('role'), equalTo('Delivery'));
        
        onValue(userQuery, (snapshot) => {
            let newDeliveryDrivers = [];

            snapshot.forEach((userSnapshot) => {
                const user = userSnapshot.val();
                newDeliveryDrivers.push(user);
            });

            setDeliveryDrivers(newDeliveryDrivers);
        });
    }, []);

    const formatStatus = (status) => {
        if (status === "ReadyForShipping") {
            return "Ready For Shipping";
        } else if (status === "OnHold") {
            return "Resolving Reports...";
        }
        return status;
    };    

    return (
        <Flex w="full" bg="#f4f4f4" direction="column" alignItems="center" p={3}>
            <Flex w="full">
                <Tabs w="full" size="md" variant="unstyled">
                    <TabList>
                        <Tab style={{ outline: "none" }}>Pending Orders</Tab>
                        <Tab style={{ outline: "none" }}>Order History</Tab>
                        <Tab style={{ outline: "none" }}>Reports</Tab>
                    </TabList>
                    <TabIndicator mt='-1.5px' height='2px' bg='blue.500' borderRadius='1px' />
                    <TabPanels>
                        <TabPanel>
                            <Flex w="full" direction="column">
                                {pendingOrders.length === 0 ? (
                                    <Flex w="full" direction="column" alignItems="center" mt={5}>
                                        <Text fontSize="xl" fontWeight="700">No pending orders</Text>
                                    </Flex>
                                ) : (
                                    pendingOrders.map((order, index) => (
                                        <NavLink key={index} to={`/order-details/${order.id}`} style={{ textDecoration: "none" }}>
                                            <Flex w="full" h="20rem" direction="column" p={3} bg="white" boxShadow="lg" my={2} transition="transform 0.2s" _hover={{ transform: 'scale(1.01)' }}>
                                                <Flex w="full" direction="row" justifyContent="space-between">
                                                    <Flex w="full" direction="column" gap={3} ml={2}>
                                                        <Flex>
                                                            <Text fontSize="lg" fontWeight="semibold" color="gray.500">Order ID:</Text>
                                                            <Text fontSize="lg" fontWeight="semibold" color="blue.500" ml={2}>{order.order_id}</Text>
                                                        </Flex>
                                                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                                                        <Flex w="full" direction="row">
                                                            <Flex w="full" direction="column" gap={7}>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <BsCalendar2Date size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Order Date</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.created_on}</Text>                                                                
                                                                    </Flex>                                                                    
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <TbMoneybag size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Total</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">RM {order.total}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <TbTruckDelivery size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Delivery Status</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">
                                                                        {order.completion_status ? (
                                                                            Object.entries(order.completion_status)
                                                                                .sort((a, b) => new Date(b[1]) - new Date(a[1]))
                                                                                .slice(0, 1)
                                                                                .map(([status]) => (
                                                                                    <Text key={status} fontSize="md" fontWeight="semibold" color="blue.500">
                                                                                        {formatStatus(status)}
                                                                                    </Text>
                                                                                ))
                                                                        ) : (
                                                                            <Text fontSize="md" fontWeight="semibold" color="blue.500">Status not available</Text>
                                                                        )}
                                                                        </Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                            </Flex>
                                                            <Flex w="full" direction="column" gap={7}>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <TbTruckDelivery size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Shipping Date</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.shipping_date}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <IoTimeOutline size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Shipping Time</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.shipping_time}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <CiCreditCard2 size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Payment Method</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.payment_method}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                            </Flex>
                                                            <Flex w="full" direction="column" gap={7}>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <CiUser size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Customer Name</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.user.name}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <CiPhone size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Customer Contact</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.user.contact}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <FaCar size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Assigned Driver</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{
                                                                            deliveryDrivers.find((driver) => driver.uid === order.driver_id)?.name || "Not assigned"
                                                                        }</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                    <Flex onClick={(e) => e.preventDefault()} ml={3}>
                                                        <Flex w="19rem" direction="column" mx={2}>
                                                            <Slider {...settings}>
                                                                {order.items.map((item, itemIndex) => (
                                                                    <Flex key={itemIndex}>
                                                                        <img src={item.image} alt={item.color} style={{ width: "100%", height: "100%", objectFit: "cover", border:"none" }} />
                                                                    </Flex>
                                                                ))}
                                                            </Slider>                                                
                                                        </Flex>                                                    
                                                    </Flex>
                                                </Flex>
                                            </Flex>                                            
                                        </NavLink>
                                    ))
                                )}
                            </Flex>
                        </TabPanel>
                        <TabPanel>
                        <Flex w="full" direction="column">
                                {orderHistory.length === 0 ? (
                                    <Flex w="full" direction="column" alignItems="center" mt={5}>
                                        <Text fontSize="xl" fontWeight="700">No past orders</Text>
                                    </Flex>
                                ) : (
                                    orderHistory.map((order, index) => (
                                        <NavLink key={index} to={`/order-details/${order.id}`} style={{ textDecoration: "none" }}>
                                            <Flex w="full" h="20rem" direction="column" p={3} bg="white" boxShadow="lg" my={2} transition="transform 0.2s" _hover={{ transform: 'scale(1.01)' }}>
                                                <Flex w="full" direction="row" justifyContent="space-between">
                                                    <Flex w="full" direction="column" gap={3} ml={2}>
                                                        <Flex>
                                                            <Text fontSize="lg" fontWeight="semibold" color="gray.500">Order ID:</Text>
                                                            <Text fontSize="lg" fontWeight="semibold" color="blue.500" ml={2}>{order.order_id}</Text>
                                                        </Flex>
                                                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                                                        <Flex w="full" direction="row">
                                                            <Flex w="full" direction="column" gap={7}>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <BsCalendar2Date size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Order Date</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.created_on}</Text>                                                                
                                                                    </Flex>                                                                    
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <TbMoneybag size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Total</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">RM {order.total}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <TbTruckDelivery size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Arrival Status</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">
                                                                        {order.completion_status ? (
                                                                            Object.entries(order.completion_status)
                                                                                .sort((a, b) => new Date(b[1]) - new Date(a[1]))
                                                                                .slice(0, 1)
                                                                                .map(([status]) => (
                                                                                    <Text key={status} fontSize="md" fontWeight="semibold" color="blue.500">
                                                                                        {formatStatus(status)}
                                                                                    </Text>
                                                                                ))
                                                                        ) : (
                                                                            <Text fontSize="md" fontWeight="semibold" color="blue.500">Status not available</Text>
                                                                        )}
                                                                        </Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                            </Flex>
                                                            <Flex w="full" direction="column" gap={7}>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <TbTruckDelivery size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Shipping Date</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.shipping_date}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <IoTimeOutline size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Shipping Time</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.shipping_time}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <CiCreditCard2 size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Payment Method</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.payment_method}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                            </Flex>
                                                            <Flex w="full" direction="column" gap={7}>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <CiUser size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Customer Name</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.user.name}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <CiPhone size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Customer Contact</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.user.contact}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <FaCar size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Assigned Driver</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{
                                                                            deliveryDrivers.find((driver) => driver.uid === order.driver_id)?.name || "Not assigned"
                                                                        }</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                    <Flex onClick={(e) => e.preventDefault()} ml={3}>
                                                        <Flex w="19rem" direction="column" mx={2}>
                                                            <Slider {...settings}>
                                                                {order.items.map((item, itemIndex) => (
                                                                    <Flex key={itemIndex}>
                                                                        <img src={item.image} alt={item.color} style={{ width: "100%", height: "100%", objectFit: "cover", border:"none" }} />
                                                                    </Flex>
                                                                ))}
                                                            </Slider>                                                
                                                        </Flex>                                                    
                                                    </Flex>
                                                </Flex>
                                            </Flex>                                            
                                        </NavLink>
                                    ))
                                )}
                            </Flex>
                        </TabPanel>
                        <TabPanel>
                            <Flex w="full" direction="column">
                                {reports.length === 0 ? (
                                    <Flex w="full" direction="column" alignItems="center" gap={4}>
                                        <Text fontSize="xl" fontWeight="700">No reported orders</Text>
                                    </Flex>
                                ) : (
                                    reports.map((order, index) => (
                                        <NavLink key={index} to={`/orders/${order.id}`} style={{ textDecoration: "none" }}>
                                            <Flex w="full" h="20rem" direction="column" p={3} bg="white" boxShadow="lg" my={2} transition="transform 0.2s" _hover={{ transform: 'scale(1.01)' }}>
                                                <Flex w="full" direction="row" justifyContent="space-between">
                                                    <Flex w="full" direction="column" gap={3} ml={2}>
                                                        <Flex>
                                                            <Text fontSize="lg" fontWeight="semibold" color="gray.500">Order ID:</Text>
                                                            <Text fontSize="lg" fontWeight="semibold" color="blue.500" ml={2}>{order.order_id}</Text>
                                                        </Flex>
                                                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                                                        <Flex w="full" direction="row">
                                                            <Flex w="full" direction="column" gap={7}>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <BsCalendar2Date size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Order Date</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.created_on}</Text>                                                                
                                                                    </Flex>                                                                    
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <TbMoneybag size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Total</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">RM {order.total}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <TbTruckDelivery size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Delivery Status</Text>
                                                                        {order.completion_status ? (
                                                                            Object.entries(order.completion_status)
                                                                                .sort((a, b) => new Date(b[1]) - new Date(a[1]))
                                                                                .slice(0, 1)
                                                                                .map(([status]) => (
                                                                                    <Text key={status} fontSize="md" fontWeight="semibold" color="blue.500">
                                                                                        {formatStatus(status)}
                                                                                    </Text>
                                                                                ))
                                                                        ) : (
                                                                            <Text fontSize="md" fontWeight="semibold" color="blue.500">Status not available</Text>
                                                                        )}
                                                                    </Flex>
                                                                </Flex>
                                                            </Flex>
                                                            <Flex w="full" direction="column" gap={7}>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <TbTruckDelivery size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Shipping Date</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.shipping_date}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <CiDiscount1 size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Discount</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">
                                                                            { 
                                                                                order?.voucher ? (
                                                                                    order?.voucher?.discount_type === "Percentage" ? (
                                                                                        order?.voucher?.discount_value + "%"
                                                                                    ) : (
                                                                                        "RM " + order?.voucher?.discount_value
                                                                                    )                                                                                
                                                                                ) :
                                                                                "No Discount Applied"
                                                                            }
                                                                        </Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                            </Flex>
                                                            <Flex w="full" direction="column" gap={7}>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <IoTimeOutline size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Shipping Time</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.shipping_time}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                                <Flex alignItems="center" gap={3}>
                                                                    <CiCreditCard2 size={30} color='#d69511'/>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="md" fontWeight="semibold" color="gray.500">Payment Method</Text>
                                                                        <Text fontSize="md" fontWeight="semibold" color="blue.500">{order.payment_method}</Text>                                                                
                                                                    </Flex>
                                                                </Flex>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                    <Flex onClick={(e) => e.preventDefault()} ml={3}>
                                                        <Flex w="19rem" direction="column" mx={2}>
                                                            <Slider {...settings}>
                                                                {order.items.map((item, itemIndex) => (
                                                                    <Flex key={itemIndex}>
                                                                        <img src={item.image} alt={item.color} style={{ width: "100%", height: "100%", objectFit: "cover", border:"none" }} />
                                                                    </Flex>
                                                                ))}
                                                            </Slider>                                                
                                                        </Flex>                                                    
                                                    </Flex>
                                                </Flex>
                                            </Flex>                                            
                                        </NavLink>
                                    ))
                                )}
                            </Flex>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Flex>
        </Flex>
    )
}

export default LogisticsOrderHistory;