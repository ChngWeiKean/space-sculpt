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
    useDisclosure,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Tooltip,
    Step,
    StepDescription,
    StepIcon,
    StepIndicator,
    StepNumber,
    StepSeparator,
    StepStatus,
    StepTitle,
    Stepper,
    useSteps,
    Checkbox,
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
import { TbTruckDelivery } from "react-icons/tb";
import { GoDotFill } from "react-icons/go";
import { BsCash, BsCalendar2Date } from "react-icons/bs";
import { TbMoneybag } from "react-icons/tb";
import { CiDiscount1 } from "react-icons/ci";
import { CiCreditCard2 } from "react-icons/ci";
import { FaBoxOpen, FaTruck, FaHome } from 'react-icons/fa';
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
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import { assignOrderToDriver, updateOrderStatus } from "../../../api/logistics.js";

function LogisticsOrderDetails() {
    const { id } = useParams();
    const [ order, setOrder ] = useState(null);
    const [ activeStep, setActiveStep ] = useState(0);
    const [ selectedDriver, setSelectedDriver ] = useState('');
    const [ deliveryDrivers, setDeliveryDrivers ] = useState([]);
    const [ availableDrivers, setAvailableDrivers ] = useState([]);

    const updateDeliveryStatus = (status) => {
        switch (status) {
            case 'Pending':
                setActiveStep(0);
                break;
            case 'Ready For Shipping':
                setActiveStep(1);
                break;
            case 'Shipping':
                setActiveStep(1);
                break;
            case 'Arrived':
                setActiveStep(2);
                break;
            default:
                setActiveStep(0);
        }
    };

    useEffect(() => {
        const orderRef = ref(db, `orders/${id}`);
        onValue(orderRef, (snapshot) => {
            const data = snapshot.val();
            data.created_on = new Date(data.created_on).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(',', ''); 
            data.shipping_date = new Date(data.shipping_date).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });
            setOrder(data);
            updateDeliveryStatus(data.arrival_status);
        });
    }, [id]);

    useEffect(() => {
        const driversRef = ref(db, 'users');
        onValue(driversRef, (snapshot) => {
            const data = snapshot.val();
            const drivers = Object.values(data).filter((user) => user.role === 'Delivery');
        
            const driverPromises = drivers.map((driver) => {
                return new Promise((resolve) => {
                    const driverRef = ref(db, `users/${driver.uid}/pending_orders`);
                    onValue(driverRef, (pendingOrdersSnapshot) => {
                        const pendingOrders = pendingOrdersSnapshot.val();
                        if (pendingOrders) {
                            const orderPromises = pendingOrders.map((orderId) => {
                                return new Promise((resolve) => {
                                    const orderRef = ref(db, `orders/${orderId}`);
                                    onValue(orderRef, (orderSnapshot) => {
                                        const orderData = orderSnapshot.val();
                                        resolve(orderData);
                                    });
                                });
                            });
            
                            Promise.all(orderPromises).then((orders) => {
                                driver.pending_orders_details = orders;
                                resolve(driver);
                            });
                        } else {
                            resolve(driver);
                        }
                    });
                });
            });
        
            Promise.all(driverPromises).then((driversWithOrders) => {
                console.log("Delivery WITH ORDERS", driversWithOrders);
                setDeliveryDrivers(driversWithOrders);
            });
        });
    }, []);

    useEffect(() => {
        setAvailableDrivers(filterAvailableDrivers(deliveryDrivers, order));
    }, [deliveryDrivers, order]);

    const filterAvailableDrivers = (drivers, orderToAssign) => {
        return drivers?.filter((driver) => {
            if (!driver.pending_orders_details || driver.pending_orders_details.length === 0) {
                return true; // Include drivers with no pending orders
            }
    
            return driver.pending_orders_details.every((order) => {
                const orderDate = new Date(order?.shipping_date);
                const orderToAssignDate = new Date(orderToAssign?.shipping_date);
    
                // Check if orders are on the same day
                if (orderDate.toDateString() === orderToAssignDate.toDateString()) {
                    const orderTime = convertTo24Hour(order?.shipping_time);
                    const orderToAssignTime = convertTo24Hour(orderToAssign?.shipping_time);
    
                    // Check if there is at least 3 hours between the orders
                    const timeDifference = Math.abs(orderTime - orderToAssignTime) / (1000 * 60 * 60);
                    return timeDifference >= 3;
                }
    
                return true;
            });
        });
    };
    
    const convertTo24Hour = (time) => {
        const [timePart, modifier] = time.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
    
        if (modifier === 'PM' && hours < 12) {
            hours += 12;
        } else if (modifier === 'AM' && hours === 12) {
            hours = 0;
        }
    
        return new Date().setHours(hours, minutes, 0, 0); // Returns the time in milliseconds
    };

    const nameBodyTemplate = (rowData) => {
        return (
            <Flex w="full" direction="row" alignItems="center" gap={8} position="relative">
                {
                    rowData.inventory == 0 ? (
                        <Badge colorScheme="red" fontSize="lg" position="absolute" top={10} left={-6} style={{ transform: 'rotate(-45deg)'}}>Out of Stock</Badge>
                    ) : null
                }
                <img src={rowData?.image} alt={rowData?.name} style={{ width: "100px", height: "100px", objectFit: "contain" }} />
                <Flex w="full" direction="column" gap={2}>
                    <Text fontSize="lg" fontWeight="700" color="#d69511">{rowData.name}</Text>
                    <Flex w="full" direction="row">
                        <Flex w="full" direction="column">
                            <Text fontSize="sm" fontWeight="600">Dimensions</Text>
                            <Text fontSize="sm" fontWeight="400">Width: {rowData.width}cm</Text>
                            <Text fontSize="sm" fontWeight="400">Height: {rowData.height}cm</Text>
                            <Text fontSize="sm" fontWeight="400">Length: {rowData.length}cm</Text>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        );
    };

    const priceBodyTemplate = (rowData) => {
        let discountedPrice = 0.0;
        const discount = Number(rowData.discount);
        const price = Number(rowData.price);
        if (discount > 0) {
            discountedPrice = price - (price * discount / 100);
        }

        return (
            <Flex w="full" direction="row" gap={2} >
                {
                    Number(rowData.discount) > 0 ? (
                        <Flex w="full" direction="column">
                            <Flex direction="row" gap={2}>
                                <Flex direction="row" gap={2}>
                                    <Text fontWeight={600} color={"green"}>RM</Text>
                                    <Text>{discountedPrice} x {rowData.quantity}</Text>                
                                </Flex>                            
                                <Text fontWeight={600} color={"red"} textDecoration="line-through">{rowData.price}</Text>                                
                            </Flex>   
                            <Text fontSize="sm" color="#d69511">-{rowData.discount}% Discount</Text>                         
                        </Flex>
                    ) : (
                        <Flex direction="row" gap={2} alignItems="center">
                            <Text fontWeight={600} color={"green"}>RM</Text>
                            <Text>{rowData.price}</Text>       
                            <Text fontWeight={700} fontSize={'sm'} color={"gray.600"}>x {rowData.quantity}</Text>         
                        </Flex>                        
                    )
                }
            </Flex>
        );
    };

    const totalBodyTemplate = (rowData) => {
        let discountedPrice = 0.0;
        const discount = Number(rowData.discount);
        const price = Number(rowData.price);
        if (discount > 0) {
            discountedPrice = price - (price * discount / 100).toFixed(2);
        } else {
            discountedPrice = price;
        }
        const total = discountedPrice * rowData.quantity;

        return (
            <Flex w="full" direction="row" gap={2} >
                <Flex direction="row" gap={2}>
                    <Text fontWeight={600} color={"green"}>RM</Text>
                    <Text>{total.toFixed(2)}</Text>                
                </Flex>                        
            </Flex>
        );
    }

    const renderHeader = () => {
        return (
            <Flex w="full" gap={3} alignItems="center">
                <IoMdArrowRoundBack size="40px"  onClick={() => window.history.back()}/>
                <Text fontSize="lg" fontWeight="700" color="#d69511">Ordered Items</Text>
            </Flex>
        );
    }

    const header = renderHeader();

    const steps = [
        { title: 'Order Placed', description: 'Your order has been placed' },
        { title: 'Ready For Shipping', description: 'Your order is ready for shipping' },
        { title: 'Shipped', description: 'Your order is on the way' },
        { title: 'Delivered', description: 'Your order has been delivered' },
    ];

    const { isOpen: isOpenConfirmReadyForDeliveryModal, onOpen: onOpenConfirmReadyForDeliveryModal, onClose: onCloseConfirmReadyForDeliveryModal } = useDisclosure();
    const { isOpen: isOpenConfirmAssignDriverModal, onOpen: onOpenConfirmAssignDriverModal, onClose: onCloseConfirmAssignDriverModal } = useDisclosure();
    
    const handleOpenConfirmReadyForDeliveryModal = () => {
        onOpenConfirmReadyForDeliveryModal();
    };
    
    const handleOpenConfirmAssignDriverModal = () => {
        onOpenConfirmAssignDriverModal();
    };
    
    const handleCloseConfirmReadyForDeliveryModal = () => {
        onCloseConfirmReadyForDeliveryModal();
    };
    
    const handleCloseConfirmAssignDriverModal = () => {
        onCloseConfirmAssignDriverModal();
    };

    const toast = useToast();

    const handleSetReadyForDelivery = async () => {
        try {
            await updateOrderStatus(id, 'Ready For Shipping');
            toast({
                title: "Order status updated",
                description: "Order status has been updated to Ready For Shipping",
                position: "top",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error updating order status",
                description: "An error occurred while updating order status",
                position: "top",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    }

    const handleAssignDriver = async (driverId) => {
        try {
            if (!driverId) {
                toast({
                    title: "Error assigning driver",
                    description: "Please select a driver to assign",
                    position: "top",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            await assignOrderToDriver(id, driverId);
            toast({
                title: "Driver assigned",
                description: "Driver has been assigned to this order",
                position: "top",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error assigning driver",
                description: "An error occurred while assigning driver to this order",
                position: "top",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    }

    return (
        <Flex w="full" bg="#f4f4f4" direction="column" alignItems="center" p={4}>
            <Flex w="full" direction="row" gap={5}>
                <Flex w="80%" direction="column" gap={5}>
                    <Flex w="full" direction="column" bg="white" boxShadow="md">
                        <Box w="full" flexDirection={"column"}>
                            {
                                order && (
                                    <DataTable 
                                        header={header}
                                        value={order.items}
                                    >
                                        <Column field="name" header="Furniture" body={nameBodyTemplate}></Column>
                                        <Column field="color" header="Variant"></Column>
                                        <Column field="price" header="Price" body={priceBodyTemplate}></Column>
                                        <Column field="total" header="Total" body={totalBodyTemplate}></Column>
                                    </DataTable>                            
                                )
                            }
                        </Box>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                        <Flex w="full" direction="row" gap={4} justifyContent={"space-between"} px={5} py={4}>
                            <Flex w="full" direction="column">
                                <Text fontSize="lg" fontWeight="700">Order Summary</Text>
                            </Flex>
                            <Flex direction="column" gap={3}>
                                <Flex w="full" direction="row" gap={10}>
                                    <Flex w="full" direction="column" gap={3}>
                                        <Text fontSize="lg" fontWeight="600" color="gray.500">Subtotal</Text>
                                        <Text fontSize="lg" fontWeight="600" color="gray.500">Shipping</Text>
                                        <Text fontSize="lg" fontWeight="600" color="gray.500">Weight</Text>
                                        <Text fontSize="lg" fontWeight="600" color="gray.500">Discount</Text>
                                    </Flex>
                                    <Flex w="full" direction="column" gap={3} px={20}>
                                        <Flex w="full" gap={1}>
                                            <Text fontSize="md" fontWeight="700" color="gray.600">RM</Text>
                                            <Text fontSize="lg" fontWeight="700" color="gray.700">{order?.subtotal}</Text>
                                        </Flex>
                                        <Flex w="full" gap={1}>
                                            <Text fontSize="md" fontWeight="700" color="gray.600">RM</Text>
                                            <Text fontSize="lg" fontWeight="700" color="gray.700">{order?.shipping}</Text>
                                        </Flex>
                                        <Flex w="full" gap={1}>
                                            <Text fontSize="md" fontWeight="700" color="gray.600">RM</Text>
                                            <Text fontSize="lg" fontWeight="700" color="gray.700">{order?.weight}</Text>
                                        </Flex>
                                        <Flex w="full" gap={1}>
                                            <Text fontSize="md" fontWeight="700" color="gray.600">RM</Text>
                                            <Text fontSize="lg" fontWeight="700" color="gray.700">{order?.discount}</Text>
                                        </Flex>
                                    </Flex>
                                </Flex>
                                <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                                <Flex w="full" direction="row" gap={10}>
                                    <Flex w="full" direction="column" gap={2}>
                                        <Text fontSize="lg" fontWeight="600" color="gray.500">Total</Text>
                                    </Flex>
                                    <Flex w="full" direction="column" gap={2} px={20}>
                                        <Flex w="full" gap={1}>
                                            <Text fontSize="md" fontWeight="700" color="gray.600">RM</Text>
                                            <Text fontSize="lg" fontWeight="700" color="gray.700">{order?.total}</Text>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Flex>       
                    </Flex>

                    <Flex w="full" direction="column" bg="white" boxShadow="md" gap={3}>
                        <Text px={5} pt={3} fontSize="lg" fontWeight="700">Order Details</Text>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                        <Flex w="full" direction="row" gap={3} px={5} pb={3}>
                            <Flex w="full" direction="column" gap={3}>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Order ID</FormLabel>
                                    <Input 
                                        variant="outline"
                                        defaultValue={id}
                                        size="md"
                                        focusBorderColor="blue.500"
                                        w="full"
                                        isReadOnly
                                        p={2.5}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Shipping Address</FormLabel>
                                    <Input 
                                        variant="outline"
                                        defaultValue={order?.address?.address}
                                        size="md"
                                        focusBorderColor="blue.500"
                                        w="full"
                                        isReadOnly
                                        p={2.5}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Ordered on</FormLabel>
                                    <Input 
                                        variant="outline"
                                        defaultValue={order?.created_on}
                                        size="md"
                                        focusBorderColor="blue.500"
                                        w="full"
                                        isReadOnly
                                        p={2.5}
                                    />
                                </FormControl>
                            </Flex>
                            <Flex w="full" direction="column" gap={3}>
                                <Flex w="full" direction="row" gap={3}>
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Shipping Date</FormLabel>
                                        <Input 
                                            variant="outline"
                                            defaultValue={order?.shipping_date}
                                            size="md"
                                            focusBorderColor="blue.500"
                                            w="full"
                                            isReadOnly
                                            p={2.5}
                                        />
                                    </FormControl>        
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Shipping Time</FormLabel>
                                        <Input 
                                            variant="outline"
                                            defaultValue={order?.shipping_time}
                                            size="md"
                                            focusBorderColor="blue.500"
                                            w="full"
                                            isReadOnly
                                            p={2.5}
                                        />
                                    </FormControl>                                   
                                </Flex>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Payment Method</FormLabel>
                                    <Input 
                                        variant="outline"
                                        defaultValue={order?.payment_method}
                                        size="md"
                                        focusBorderColor="blue.500"
                                        w="full"
                                        isReadOnly
                                        p={2.5}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Arrival Status</FormLabel>
                                    <Input 
                                        variant="outline"
                                        defaultValue={order?.arrival_status}
                                        size="md"
                                        focusBorderColor="blue.500"
                                        w="full"
                                        isReadOnly
                                        p={2.5}
                                    />
                                </FormControl>
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
                <Flex w="20%" direction="column" gap={5}>
                    <Flex w="full" direction="column" bg="white" boxShadow="md">
                        <Text px={5} py={3} fontSize="lg" fontWeight="700">Manage Delivery</Text>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                        <Flex w="full" p={6}>
                            {
                                order && order.arrival_status === "Pending" ? (
                                    <Button
                                        w="full"
                                        colorScheme="blue"
                                        size="lg"
                                        style={{ outline:"none" }}
                                        onClick={handleOpenConfirmReadyForDeliveryModal}
                                    >
                                        Mark as Ready For Delivery
                                    </Button>
                                ) : (
                                    <Flex w="full" direction="column" gap={3}>
                                        <FormControl>
                                            <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Assign Delivery Driver</FormLabel>
                                            <Select
                                                variant="filled"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                                onChange={(e) => setSelectedDriver(e.target.value)}
                                            >
                                                <option value="">Select a driver</option>
                                                {
                                                    availableDrivers.map((driver) => (
                                                        <option key={driver.uid} value={driver.uid}>{driver.name}</option>
                                                    ))
                                                }
                                            </Select>
                                        </FormControl>
                                        <Button
                                            w="full"
                                            colorScheme="blue"
                                            size="lg"
                                            style={{ outline:"none" }}
                                            onClick={handleOpenConfirmAssignDriverModal}
                                        >
                                            Assign Driver
                                        </Button>
                                    </Flex>
                                )
                            }
                            {
                                isOpenConfirmReadyForDeliveryModal && (
                                    <Modal size={"xl"} isOpen={isOpenConfirmReadyForDeliveryModal} onClose={onCloseConfirmReadyForDeliveryModal} isCentered>
                                        <ModalOverlay
                                            bg='blackAlpha.300'
                                        />
                                        <ModalContent>
                                            <ModalHeader>Confirm Set Status</ModalHeader>
                                            <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                                            <ModalBody>
                                                <Text fontSize='md' letterSpacing='wide' fontWeight='bold' mb={2}>
                                                    Are you sure you want to set status as Ready For Delivery?
                                                </Text>
                                                <Text fontSize='sm' fontWeight='light' letterSpacing='wide'>
                                                    This action cannot be undone.
                                                </Text>
                                            </ModalBody>
                                            <ModalFooter>
                                                <Box display='flex'>
                                                    <Button 
                                                        mr={3} 
                                                        colorScheme="blue"
                                                        style={{ outline:"none" }}
                                                        onClick={() => {
                                                            handleSetReadyForDelivery();
                                                            handleCloseConfirmReadyForDeliveryModal();
                                                        }}
                                                    >
                                                        Confirm
                                                    </Button>
                                                    <Button colorScheme="red" style={{ outline:"none" }} onClick={handleCloseConfirmReadyForDeliveryModal}>
                                                        Close
                                                    </Button>
                                                </Box>
                                            </ModalFooter>
                                        </ModalContent>
                                    </Modal>
                                )
                            }
                            {
                                isOpenConfirmAssignDriverModal && (
                                    <Modal size={"xl"} isOpen={isOpenConfirmAssignDriverModal} onClose={onCloseConfirmAssignDriverModal} isCentered>
                                        <ModalOverlay
                                            bg='blackAlpha.300'
                                        />
                                        <ModalContent>
                                            <ModalHeader>Assign Driver</ModalHeader>
                                            <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                                            <ModalBody>
                                                <Text fontSize='md' letterSpacing='wide' fontWeight='bold' mb={2}>
                                                    Are you sure you want to assign this driver to this order?
                                                </Text>
                                                <Text fontSize='sm' fontWeight='light' letterSpacing='wide'>
                                                    This action cannot be undone.
                                                </Text>
                                            </ModalBody>
                                            <ModalFooter>
                                                <Box display='flex'>
                                                    <Button 
                                                        mr={3} 
                                                        colorScheme="blue"
                                                        style={{ outline:"none" }}
                                                        onClick={() => {
                                                            handleAssignDriver(selectedDriver);
                                                            handleCloseConfirmAssignDriverModal();
                                                        }}
                                                    >
                                                        Confirm
                                                    </Button>
                                                    <Button colorScheme="red" style={{ outline:"none" }} onClick={handleCloseConfirmAssignDriverModal}>
                                                        Close
                                                    </Button>
                                                </Box>
                                            </ModalFooter>
                                        </ModalContent>
                                    </Modal>
                                )
                            }
                        </Flex>
                    </Flex>
                    <Flex w="full" direction="column" bg="white" boxShadow="md">
                        <Text px={5} py={3} fontSize="lg" fontWeight="700">Order Status</Text>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                        <Flex w="full" p={6}>
                            <Stepper index={activeStep} orientation='vertical' height='500px' gap='0'>
                                {steps.map((step, index) => (
                                    <Step key={index}>
                                        <StepIndicator>
                                        <StepStatus
                                            complete={<StepIcon />}
                                            incomplete={<StepNumber />}
                                            active={<StepNumber />}
                                        />
                                        </StepIndicator>

                                        <Box flexShrink='0'>
                                            <StepTitle>{step.title}</StepTitle>
                                            <StepDescription>{step.description}</StepDescription>
                                        </Box>

                                        <StepSeparator />
                                    </Step>
                                ))}
                            </Stepper>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
}

export default LogisticsOrderDetails;