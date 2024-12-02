import {
	Text,
    Flex,
    Button,
    Divider,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    TabIndicator,
    Textarea,
    IconButton,
    useToast,
} from "@chakra-ui/react";
import {  useState, useEffect } from "react";
import { TbTruckDelivery } from "react-icons/tb";
import { BsCalendar2Date } from "react-icons/bs";
import { TbMoneybag } from "react-icons/tb";
import { CiDiscount1 } from "react-icons/ci";
import { CiCreditCard2 } from "react-icons/ci";
import { IoTimeOutline } from "react-icons/io5";
import { NavLink } from 'react-router-dom';
import { useAuth } from "../../components/AuthCtx.jsx";
import { FaStar } from "react-icons/fa6";
import { IoMdSend } from "react-icons/io";
import { db } from "../../../api/firebase";
import { onValue, ref } from "firebase/database";
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { submitReview } from "../../../api/customer.js";

function CustomerOrderHistory() {
    const { user } = useAuth();
    const [ pendingOrders, setPendingOrders ] = useState([]);
    const [ orderHistory, setOrderHistory ] = useState([]);
    const [ toReviews, setToReviews ] = useState([]);
    const [ reviews, setReviews ] = useState({});
    const [ reports, setReports ] = useState([]);
    const [ratings, setRatings] = useState({});

    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false
    };

    const handleReviewChange = (itemIndex, value) => {
        setReviews(prevReviews => ({
            ...prevReviews,
            [itemIndex]: value
        }));
    };

    const handleRatingChange = (itemIndex, ratingValue) => {
        setRatings(prevRatings => ({
            ...prevRatings,
            [itemIndex]: ratingValue
        }));
    };

    useEffect(() => {
        if (user) {
            let orderIds = user.orders;
            let newPendingOrders = [];
            let newOrderHistory = [];
            let newToReviews = [];
            let newReports = [];
            if (!orderIds) return;
            orderIds.forEach(orderId => {
                let orderRef = ref(db, `orders/${orderId}`);
                onValue(orderRef, (snapshot) => {
                    let order = snapshot.val();
                    if (order) {
                        let date = new Date(order.created_on);
                        let formattedDate = date.getDate() + " " + date.toLocaleString('default', { month: 'long' }) + " " + date.getFullYear();
                        let shippingDate = new Date(order.shipping_date);
                        let formattedShippingDate = shippingDate.getDate() + " " + shippingDate.toLocaleString('default', { month: 'long' }) + " " + shippingDate.getFullYear();
                        order.created_on = formattedDate;
                        order.shipping_date = formattedShippingDate;
                        order.id = snapshot.key;
    
                        if (!order.completion_status.Completed && !order.completion_status.OnHold) {
                            newPendingOrders.push(order);
                            newPendingOrders.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
                            setPendingOrders([...newPendingOrders]);
                        } else if (order.completion_status.OnHold) {
                            newReports.push(order);
                            newReports.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
                            setReports([...newReports]);
                        } else {
                            newOrderHistory.push(order);
                            newOrderHistory.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
                            setOrderHistory([...newOrderHistory]);
                            for (let i = 0; i < order.items.length; i++) {
                                // Check if any item in the order has not been reviewed
                                if (!order.items[i].reviewed) {
                                    newToReviews.push(order);
                                    newToReviews.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
                                    setToReviews([...newToReviews]);
                                    break;
                                }
                            }
                        }
                    }
                });
            });
        }
    }, [user]);

    const formatStatus = (status) => {
        if (status === "ReadyForShipping") {
            return "Ready For Shipping";
        } else if (status === "OnHold") {
            return "Resolving Reports...";
        }
        return status;
    };    

    const toast = useToast();

    const submitRating = async (orderId, itemId, rating, review) => {
        if (!rating) {
            rating = 1;
        } else if (!review) {
            review = "";
        }

        const reviewData = {
            orderId: orderId,
            itemId: itemId,
            rating: rating,
            review: review
        };

        try {
            await submitReview(reviewData);
            toast({
                title: "Review submitted successfully",
                status: "success",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
            // Refresh the page
            window.location.reload();
        } catch (error) {
            toast({
                title: "Failed to submit review",
                status: "error",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
        }
    }
    
    return (
        <Flex w="full" bg="#f4f4f4" direction="column" alignItems="center" p={3}>
            <Flex w="full">
                <Tabs w="full" size="md" variant="unstyled">
                    <TabList>
                        <Tab style={{ outline: "none" }}>Pending Orders</Tab>
                        <Tab style={{ outline: "none" }}>Order History</Tab>
                        <Tab style={{ outline: "none" }}>To Review</Tab>
                        <Tab style={{ outline: "none" }}>Reports</Tab>
                    </TabList>
                    <TabIndicator mt='-1.5px' height='2px' bg='blue.500' borderRadius='1px' />
                    <TabPanels>
                        <TabPanel>
                            <Flex w="full" direction="column">
                                {pendingOrders.length === 0 ? (
                                    <Flex w="full" direction="column" alignItems="center" gap={4}>
                                        <Text fontSize="xl" fontWeight="700">No pending orders</Text>
                                        <Text fontSize="lg" fontWeight="400">Looks like you haven't ordered anything yet</Text>
                                        <Button colorScheme="blue" size="lg" as={NavLink} to={'/'}>Start Shopping</Button>
                                    </Flex>
                                ) : (
                                    pendingOrders.map((order, index) => (
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
                                                                        <img src={item.image} alt={item.color} style={{ width: "100%", height: "17rem", objectFit: "contain", border:"none" }} />
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
                                    <Flex w="full" direction="column" alignItems="center" gap={4}>
                                        <Text fontSize="xl" fontWeight="700">No past orders</Text>
                                        <Text fontSize="lg" fontWeight="400">Looks like you haven't ordered anything yet</Text>
                                        <Button colorScheme="blue" size="lg" as={NavLink} to={'/'}>Start Shopping</Button>
                                    </Flex>
                                ) : (
                                    orderHistory.map((order, index) => (
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
                                                                        <img src={item.image} alt={item.color} style={{ width: "100%", height: "17rem", objectFit: "contain", border:"none" }} />
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
                                {toReviews.length === 0 ? (
                                    <Flex w="full" direction="column" alignItems="center" gap={4}>
                                        <Text fontSize="xl" fontWeight="700">No items to review</Text>
                                        <Button colorScheme="blue" size="lg" as={NavLink} to={'/'}>Start Shopping</Button>
                                    </Flex>
                                ) : (
                                    <Flex w="full" direction="column" justifyContent="center" gap={2}>
                                        {
                                            toReviews.map((order, index) => (
                                                <Flex w="60%" direction="column" p={3} bg="white" boxShadow="lg" my={2} key={index}>
                                                    <Text fontSize="lg" fontWeight="semibold" color="gray.700">Order ID: {order.order_id}</Text>
                                                    {
                                                        order.items.map((item, itemIndex) => (
                                                            !item.reviewed && (
                                                                <Flex key={itemIndex} w="full" direction="row" justifyContent="space-between" alignItems="center">
                                                                    <Flex w="full" direction="row" gap={5} p={3}>
                                                                        <img src={item.image} alt={item.color} style={{ width: "8rem", height: "8rem", objectFit: "contain", border:"none" }} />
                                                                        <Flex w="full" direction="column" gap={2}>
                                                                            <Flex w="full" direction="row" justifyContent="space-between" alignItems="center">
                                                                                <Flex w="full" gap={2} alignItems="center">
                                                                                    <Text fontSize="md" fontWeight="semibold" color="gray.500">{item.name}</Text> |
                                                                                    <Text fontSize="md" fontWeight="semibold" color="blue.500">RM {item.price}</Text> |
                                                                                    <Text fontSize="md" fontWeight="semibold" color="gray.500">{item.color}</Text> |
                                                                                    {
                                                                                        Array(5)
                                                                                        .fill('')
                                                                                        .map((_, i) => (
                                                                                            <FaStar
                                                                                                size={"20px"}
                                                                                                key={i}
                                                                                                color={i < (ratings[itemIndex] || 1) ? '#d69511' : 'gray'}
                                                                                                onClick={() => handleRatingChange(itemIndex, i + 1)}
                                                                                                style={{ cursor: 'pointer' }}
                                                                                            />
                                                                                        ))
                                                                                    }                                                                                       
                                                                                </Flex>
                                                                                <IconButton
                                                                                    colorScheme="blue"
                                                                                    aria-label="Send"
                                                                                    icon={<IoMdSend />}
                                                                                    style={{ outline: "none" }}
                                                                                    onClick={() => submitRating(order.id, item.id, ratings[itemIndex], reviews[itemIndex])}
                                                                                />  
                                                                            </Flex>
                                                                            <Textarea
                                                                                placeholder="Write a review..."
                                                                                value={reviews[itemIndex] || ''}
                                                                                onChange={(e) => handleReviewChange(itemIndex, e.target.value)}
                                                                                size="sm"
                                                                                variant="unstyled"
                                                                                padding={3}
                                                                                borderRadius="md"
                                                                                rounded="md"
                                                                                borderWidth="1px"
                                                                                borderColor="gray.300"
                                                                                color="gray.900"
                                                                                focusBorderColor="blue.500"
                                                                                w="full"
                                                                            />
                                                                        </Flex>
                                                                    </Flex>
                                                                </Flex>
                                                            )
                                                        ))
                                                    }
                                                    <Flex w="full" direction="row" gap={3}>

                                                    </Flex>
                                                </Flex>
                                            ))                                            
                                        }
                                    </Flex>
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
                                                                        <img src={item.image} alt={item.color} style={{ width: "100%", height: "17rem", objectFit: "contain", border:"none" }} />
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

export default CustomerOrderHistory;
