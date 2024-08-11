import {
	Text,
    Flex,
    Box,
    Input,
    FormControl,
    FormLabel,
    useToast,
    Divider,
    Select,
    Badge,
    Step,
    StepDescription,
    StepIcon,
    StepIndicator,
    StepNumber,
    StepSeparator,
    StepStatus,
    StepTitle,
    Stepper,
    Checkbox,
    IconButton,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { CiEdit } from "react-icons/ci";
import { IoMdCheckmark } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import { useParams } from 'react-router-dom';
import { db } from "../../../api/firebase";
import { onValue, ref } from "firebase/database";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import { updateShipping } from "../../../api/customer.js";

function CustomerOrderDetails() {
    const { id } = useParams();
    const [ order, setOrder ] = useState(null);
    const [ activeStep, setActiveStep ] = useState(0);
    const [ isEditing, setIsEditing ] = useState(false);
    const [ settings, setSettings ] = useState({});
    const [ timeOptions, setTimeOptions ] = useState([]);
    const [ shippingDate, setShippingDate ] = useState(order?.shipping_date);
    const [ shippingTime, setShippingTime ] = useState(order?.shipping_time);
    const [ hoursDifference, setHoursDifference ] = useState(0);
    const [steps, setSteps] = useState([]);

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).replace(',', '');
    };

    const updateDeliveryStatus = (completionStatus) => {
        if (!completionStatus) {
            setActiveStep(0);
            return;
        }

        const statusOrder = ['Pending', 'Ready For Shipping', 'Shipping', 'Arrived'];
        let latestStatus = 'Pending';

        for (const status of statusOrder) {
            if (completionStatus[status]) {
                latestStatus = status;
            }
        }

        switch (latestStatus) {
            case 'Pending':
                setActiveStep(0);
                break;
            case 'Ready For Shipping':
                setActiveStep(1);
                break;
            case 'Shipping':
                setActiveStep(2);
                break;
            case 'Arrived':
                setActiveStep(3);
                break;
            default:
                setActiveStep(0);
        }
    };

    const updateSteps = (completionStatus) => {
        const defaultSteps = [
            { title: 'Order Placed', description: 'Your order has been placed' },
            { title: 'Ready For Shipping', description: 'Your order is ready for shipping' },
            { title: 'Shipped', description: 'Your order is on the way' },
            { title: 'Delivered', description: 'Your order has been delivered' },
        ];

        const stepsWithTimestamps = defaultSteps.map((step, index) => {
            const statusKey = Object.keys(completionStatus)[index];
            if (statusKey) {
                return {
                    ...step,
                    timestamp: formatTimestamp(completionStatus[statusKey])
                };
            }
            return step;
        });

        setSteps(stepsWithTimestamps);
    };

    useEffect(() => {
        const orderRef = ref(db, `orders/${id}`);
        onValue(orderRef, (snapshot) => {
            const data = snapshot.val();
            const createdOnDate = new Date(data?.created_on);
            const now = new Date();
            const timeDifference = now - createdOnDate;
            setHoursDifference(timeDifference / (1000 * 60 * 60));            
            data.created_on = new Date(data?.created_on).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(',', ''); 
            console.log("ORDER DATA:", data);
            setOrder(data);
            updateDeliveryStatus(data.completion_status);
            updateSteps(data.completion_status);

            console.log("ORDER DATA:", data.completion_status);
        });
    }, [id]);

    useEffect(() => {
        const settingsRef = ref(db, 'settings');
        onValue(settingsRef, (snapshot) => {
            const settings = snapshot.val();
            let options = generateTimeOptions(settings.initial_delivery_time, settings.end_delivery_time, 60);
            setTimeOptions(options);
            setSettings(settings);
        });
    }, []);

    function generateTimeOptions(startTime, endTime, interval = 60) { 
        const times = [];
        let start = parseTime(startTime);
        const end = parseTime(endTime);
        
        while (start <= end) {
            times.push(formatTime(start));
            start.setMinutes(start.getMinutes() + interval);
        }
        return times;
    }

    function parseTime(timeString) {
        const [time, modifier] = timeString.split(/(am|pm)/i);
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours, 10);
        minutes = minutes ? parseInt(minutes, 10) : 0;

        if (modifier.toLowerCase() === 'pm' && hours < 12) {
            hours += 12;
        }
        if (modifier.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
        }

        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    function formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutesStr} ${ampm}`;
    }

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const toast = useToast();

    const handleSaveClick = async () => {
        // Add logic to save the updated shipping date and time
        if (!shippingDate || !shippingTime) {
            toast({
                title: "Please fill in the shipping date and time",
                status: "error",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // if shipping date is today, and offset by settings.delivery_offset in days (e.g. 3 days offset from date of order)
        // offset is number of days (e.g. 3)
        const offset = settings.delivery_offset;
        const newShippingDate = new Date(shippingDate);

        // Set the time of shippingDate to the start of the day to avoid time comparison issues
        newShippingDate.setHours(0, 0, 0, 0);

        // Get today's date and set the time to the start of the day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add offset days to today to get the deliveryDate
        const deliveryDate = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);

        if (newShippingDate < deliveryDate) {
            toast({
                title: `Please select a shipping date at least ${offset} days from today`,
                status: "error",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        let data = {
            shipping_date: shippingDate,
            shipping_time: shippingTime,
        };

        try {
            await updateShipping(id, data);
            toast({
                title: "Shipping date and time updated successfully",
                status: "success",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Failed to update shipping date and time",
                status: "error",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
        }

        setIsEditing(false);
    };

    const handleCancelClick = () => {
        setShippingDate(order?.shipping_date);
        setShippingTime(order?.shipping_time);
        setIsEditing(false);
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

    const checkListBodyTemplate = (rowData) => {
        return (
            <Flex w="full" direction="row" gap={2} alignItems="center">
                <Checkbox 
                    size="lg" 
                    checked={rowData.checked} 
                    onChange={(e) => onCheckChange(e, rowData)} 
                    isDisabled={ rowData?.arrival_status === "Arrived" ? false : true }
                />
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
                                        <Column field="check" header="Checklist" body={checkListBodyTemplate}></Column>
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
                                            <Text fontSize="md" fontWeight="700" color="gray.600">- RM</Text>
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
                        <Flex justifyContent="space-between" alignItems="center" px={5} pt={3}>
                            <Text fontSize="lg" fontWeight="700">Order Details</Text>
                            {hoursDifference <= 24 && (
                                isEditing ? (
                                    <Box>
                                        <IconButton
                                            icon={<IoMdCheckmark />}
                                            onClick={handleSaveClick}
                                            mr={2}
                                            colorScheme="green"
                                            style={{ outline: "none" }}
                                        />
                                        <IconButton
                                            icon={<RxCross2 />}
                                            onClick={handleCancelClick}
                                            colorScheme="red"
                                            style={{ outline: "none" }}
                                        />
                                    </Box>
                                ) : (
                                    <IconButton
                                        icon={<CiEdit />}
                                        onClick={handleEditClick}
                                        colorScheme="blue"
                                        style={{ outline: "none" }}
                                    />
                                )
                            )}
                        </Flex>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                        <Flex w="full" direction="row" gap={3} px={5} pb={3}>
                            <Flex w="full" direction="column" gap={3}>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Order ID</FormLabel>
                                    <Input 
                                        variant="outline"
                                        defaultValue={order?.order_id}
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
                                            type="date"
                                            variant="outline"
                                            defaultValue={order?.shipping_date}
                                            size="md"
                                            focusBorderColor="blue.500"
                                            w="full"
                                            p={2.5}
                                            isReadOnly={!isEditing}
                                            onChange={(e) => setShippingDate(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Shipping Time</FormLabel>
                                        {
                                            isEditing ? (
                                                <Select
                                                    variant="outline"
                                                    value={shippingTime}
                                                    size="md"
                                                    focusBorderColor="blue.500"
                                                    w="full"
                                                    isReadOnly={!isEditing}
                                                    onChange={(e) => setShippingTime(e.target.value)}
                                                >
                                                    <option value="">Select a time</option>
                                                    {timeOptions?.map((time, index) => (
                                                        <option key={index} value={time}>
                                                            {time}
                                                        </option>
                                                    ))}
                                                </Select>
                                            ) : (
                                                <Input 
                                                    variant="outline"
                                                    defaultValue={order?.shipping_time}
                                                    size="md"
                                                    focusBorderColor="blue.500"
                                                    w="full"
                                                    isReadOnly
                                                    p={2.5}
                                                />
                                            )
                                        }
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
                                        defaultValue={
                                            order?.completion_status && (
                                                `${Object.keys(order.completion_status).pop()}`
                                            )
                                        }
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
                <Flex w="20%" direction="column">
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
                                            {step.timestamp && (
                                                <Text fontSize="sm" color="gray.500">
                                                    {step.timestamp}
                                                </Text>
                                            )}
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

export default CustomerOrderDetails;