import {
	Text,
    Flex,
    Box,
    Button,
    Input,
    FormControl,
    FormLabel,
    Textarea,
    useToast,
    Divider,
    Badge,
    useDisclosure,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Step,
    StepDescription,
    StepIcon,
    StepIndicator,
    StepNumber,
    StepSeparator,
    StepStatus,
    StepTitle,
    Stepper,
    Image,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useParams, Link } from 'react-router-dom';
import { db } from "../../../api/firebase";
import { onValue, ref } from "firebase/database";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import { resolveReport } from "../../../api/admin.js";

function AdminOrderDetails() {
    const { id } = useParams();
    const toast = useToast();
    const [ order, setOrder ] = useState(null);
    const [ activeStep, setActiveStep ] = useState(0);
    const [ deliveryDriver, setDeliveryDriver ] = useState(null);
    const [ report, setReport ] = useState(null);
    const [ reportResolveDescription, setReportResolveDescription ] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isOpenProof, onOpen: onOpenProof, onClose: onCloseProof } = useDisclosure();
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
    
    const updateDeliveryStatus = (latestStatus) => {
        switch (latestStatus) {
            case 'Pending':
                setActiveStep(1);
                break;
            case 'ReadyForShipping':
                setActiveStep(2);
                break;
            case 'Shipping':
                setActiveStep(3);
                break;
            case 'Arrived':
                setActiveStep(4);
                break;
            case 'Resolved':
                setActiveStep(5);
                break;
            case 'Completed':
                setActiveStep(6);
                break;
            case 'OnHold':
                setActiveStep(5);
                break;
            default:
                setActiveStep(0);
        }
    };
    
    const updateSteps = (completionStatus) => {
        const statusMapping = {
            'Pending': 'Order Placed',
            'ReadyForShipping': 'Ready For Shipping',
            'Shipping': 'Shipped',
            'Arrived': 'Delivered',
            'Resolved': 'Resolved',
            'Completed': 'Completed',
            'OnHold': 'On Hold'
        };
    
        // Define the base steps without 'Resolved' and 'On Hold'
        let steps = [
            { title: 'Order Placed', description: 'The order has been placed' },
            { title: 'Ready For Shipping', description: 'The order is ready for shipping' },
            { title: 'Shipped', description: 'The order is on the way' },
            { 
                title: 'Delivered', 
                description: (
                    <>
                        <Text>The order has been delivered</Text>
                        <Link color="blue.500" onClick={onOpenProof}>View Proof of Delivery</Link>
                    </>
                )
            },
        ];
    
        // If 'Resolved' exists, add it as a step before 'Completed'
        if (completionStatus.Resolved) {
            steps.push({ title: 'Resolved', description: 'The issue has been resolved' });
        }
    
        // If 'OnHold' exists, replace the 'Completed' step with 'On Hold'
        if (completionStatus.OnHold) {
            steps.push({
                title: 'On Hold',
                description: 'The order is currently on hold',
                timestamp: formatTimestamp(completionStatus.OnHold),
                isOnHold: true,
            });
        } else {
            // Add 'Completed' as the final step if 'OnHold' does not exist
            steps.push({ title: 'Completed', description: 'The order has been completed' });
        }
    
        // Add timestamps to the steps where applicable
        const stepsWithTimestamps = steps.map((step) => {
            const statusKey = Object.keys(completionStatus).find(key => statusMapping[key] === step.title);
            if (statusKey && completionStatus[statusKey]) {
                return {
                    ...step,
                    timestamp: formatTimestamp(completionStatus[statusKey]),
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
    
            // Format the created_on date
            data.created_on = new Date(data.created_on).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(',', ''); 
    
            // Format the shipping_date
            data.shipping_date = new Date(data.shipping_date).toISOString().split('T')[0];
            
            // Sort the completion_status by timestamp and get the latest status
            const sortedStatuses = Object.entries(data.completion_status || {}).sort(
                ([, aTimestamp], [, bTimestamp]) => new Date(bTimestamp) - new Date(aTimestamp)
            );
    
            const latestStatus = sortedStatuses.length > 0 ? sortedStatuses[0][0] : null;
    
            console.log("Status", latestStatus);
            setOrder(data);
            updateDeliveryStatus(latestStatus); 
            updateSteps(data.completion_status);
        });
    }, [id]);  

    useEffect(() => {
        const reportRef = ref(db, `reports`);
        onValue(reportRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const reports = Object.keys(data).map((key) => ({
                    ...data[key],
                    id: key, 
                }));
    
                // Find the report with the matching order_id
                const orderReport = reports.find((report) => report.order_id === id);
                if (orderReport) {
                    setReport(orderReport);
                }
            }
        });
    }, [id]);

    useEffect(() => {
        if (order?.driver_id) {
            const driversRef = ref(db, `users/${order.driver_id}`);
            onValue(driversRef, (snapshot) => {
                const data = snapshot.val();
                setDeliveryDriver(data);
            });
        }
    }, [order]);

    const reportType = {
        'damaged': 'Damaged Product',
        'missing': 'Missing Item'
    }

    const manageReport = async () => {
        if (!reportResolveDescription) {
            toast({
                title: 'Resolve Description Required',
                description: 'Please provide a description to resolve the report',
                status: 'error',
                position: 'top',
                duration: 5000,
                isClosable: true
            });
            return;
        }
        
        await resolveReport(report.id, reportResolveDescription);

        toast({
            title: 'Report Resolved',
            description: 'The report has been resolved successfully',
            status: 'success',
            position: 'top',
            duration: 5000,
            isClosable: true
        });
    }

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
            <Flex w="full" justifyContent="space-between">
                <Flex w="full" gap={3} alignItems="center">
                    <IoMdArrowRoundBack size="40px"  onClick={() => window.history.back()}/>
                    <Text fontSize="lg" fontWeight="700" color="#d69511">Ordered Items Checklist</Text>
                </Flex>
                {
                    order?.completion_status?.OnHold && (
                        <Flex gap={3} alignItems="center">
                            <Button
                                w="15rem"
                                colorScheme="blue"
                                size="md"
                                style={{ outline:'none' }}
                                onClick={() => onOpen()}
                            >
                                Resolve Report
                            </Button>
                        </Flex>
                    )
                }
            </Flex>
        );
    }

    const formatStatus = (status) => {
        if (status === "ReadyForShipping") {
            return "Ready For Shipping";
        } else if (status === "OnHold") {
            return "Resolving Reports...";
        }
        return status;
    };      

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
                        <Text px={5} pt={3} fontSize="lg" fontWeight="700">Order Details</Text>
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
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Delivery Status</FormLabel>
                                    <Input 
                                        variant="outline"
                                        defaultValue={
                                            order?.completion_status && (
                                                `${formatStatus(Object.entries(order.completion_status)
                                                    .sort(([ , aTimestamp], [ , bTimestamp]) => new Date(bTimestamp) - new Date(aTimestamp))
                                                    .map(([status]) => status)[0])}`
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
                        <Flex w="full" direction="row" gap={3} px={5} pb={3}>
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Remarks</FormLabel>
                                <Textarea
                                    variant="outline"
                                    defaultValue={order?.remarks}
                                    size="md"
                                    focusBorderColor="blue.500"
                                    w="full"
                                    isReadOnly
                                    p={2.5}
                                />
                            </FormControl>
                        </Flex>
                    </Flex>
                    <Modal size='3xl' isOpen={isOpen} onClose={onClose}>
                        <ModalOverlay bg='blackAlpha.300' />
                        <ModalContent>
                            <ModalHeader>
                                <Text fontSize="lg" fontWeight="700" color="gray.600" letterSpacing="wide">Report Incomplete Delivery / Damaged Products</Text>
                            </ModalHeader>
                            <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                            <ModalBody>
                                <Flex w="full" gap={1} direction="column">
                                    <Text fontSize="md" fontWeight="500" color="gray.600" letterSpacing="wide">Please check the items that are damaged or not delivered</Text>
                                    <Divider my={2} borderWidth='1px' borderColor="gray.300" />
                                    {
                                        report?.items.map((item, index) => (
                                            <Flex w="full" direction="row" key={index} gap={5} alignItems="center">
                                                <Text fontSize="md" fontWeight="500" color="gray.600" letterSpacing="wide" flexShrink={0}>
                                                    {item.name}
                                                </Text>
                                                <Divider h="1rem" border={"1px"} orientation="vertical" borderColor="gray.300" />
                                                <Text fontSize="md" fontWeight="500" color="gray.600" letterSpacing="wide" flexShrink={0}>
                                                    {item.color}
                                                </Text>
                                                <Divider h="1rem" border={"1px"} orientation="vertical" borderColor="gray.300" />
                                                {
                                                    Number(item.discount) > 0 ? (
                                                        <Flex w="full" direction="column" flexGrow={1}>
                                                            <Flex direction="row" gap={2} alignItems="center">
                                                                <Flex direction="row" gap={2} alignItems="center">
                                                                    <Text fontWeight={600} color={"green"} flexShrink={0}>RM</Text>
                                                                    <Text flexShrink={1}>{Number(item.price) - (Number(item.price) * Number(item.discount) / 100)} x {item.quantity}</Text>
                                                                </Flex>
                                                                <Text fontWeight={600} color={"red"} textDecoration="line-through" flexShrink={0}>
                                                                    {item.price}
                                                                </Text>
                                                            </Flex>
                                                            <Text fontSize="sm" color="#d69511">-{item.discount}% Discount</Text>
                                                        </Flex>
                                                    ) : (
                                                        <Flex direction="row" gap={2} alignItems="center" flexGrow={1}>
                                                            <Text fontWeight={600} color={"green"} flexShrink={0}>RM</Text>
                                                            <Text flexShrink={1}>{item.price}</Text>
                                                            <Text fontWeight={700} fontSize={'sm'} color={"gray.600"} flexShrink={0}>x {item.quantity}</Text>
                                                        </Flex>
                                                    )
                                                }
                                                <FormControl>
                                                    <Input
                                                        variant="unstyled"
                                                        type="text"
                                                        defaultValue={reportType[item.reportType]}
                                                        placeholder="Enter report here..."
                                                        readOnly
                                                        rounded="md"
                                                        borderWidth="1px"
                                                        borderColor="gray.300"
                                                        color="gray.900"
                                                        size="md"
                                                        w="full"
                                                        p={2.5}
                                                    />
                                                </FormControl>
                                            </Flex>
                                        ))
                                    }
                                    <Divider my={2} borderWidth='1px' borderColor="gray.300" />
                                    <FormControl>
                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                            Report Description
                                        </FormLabel>        
                                        <Textarea
                                            variant="unstyled"
                                            type="text"
                                            id="description"
                                            defaultValue={report?.description}
                                            placeholder="Enter report description here..."
                                            readOnly
                                            rounded="md"
                                            h={"150px"}
                                            borderWidth="1px"
                                            borderColor="gray.300"
                                            color="gray.900"
                                            size="md"
                                            w="full"
                                            p={2.5}
                                        />
                                    </FormControl>   
                                    <FormControl>
                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                            Resolve Description
                                        </FormLabel>
                                        <Textarea   
                                            variant="unstyled"
                                            type="text"
                                            id="resolveDescription"
                                            placeholder="Enter resolve description here..."
                                            value={reportResolveDescription}
                                            onChange={(e) => setReportResolveDescription(e.target.value)}
                                            rounded="md"
                                            h={"150px"}
                                            borderWidth="1px"
                                            borderColor="gray.300"
                                            color="gray.900"
                                            size="md"
                                            w="full"
                                            p={2.5}
                                        />
                                    </FormControl>
                                </Flex>
                                <ModalFooter>
                                    <Flex w="full" direction="row" gap={3} alignItems="center" justifyContent="flex-end">
                                        <Button colorScheme="red" onClick={manageReport}>
                                            Resolve
                                        </Button>                                            
                                        <Button colorScheme="blue" onClick={onClose}>
                                            Close
                                        </Button>
                                    </Flex>
                                </ModalFooter>
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                    <Modal size='xl' isOpen={isOpenProof} onClose={onCloseProof}>
                        <ModalOverlay bg='blackAlpha.300' />
                        <ModalContent>
                            <ModalHeader>
                                <Text fontSize="lg" fontWeight="700" color="gray.600" letterSpacing="wide">Proof of Delivery</Text>
                            </ModalHeader>
                            <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                            <ModalBody>
                                <Flex w="full" gap={1} direction="column" justifyContent="center" alignItems="center">
                                    {
                                        order?.proof_of_delivery && (
                                            order?.proof_of_delivery.map((proof, index) => (
                                                <Image key={index} src={proof} alt={`Proof of Delivery ${index}`} width={300} objectFit={"contain"} />
                                            ))
                                        )
                                    }
                                </Flex>
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                </Flex>
                <Flex w="20%" direction="column" gap={5}>
                    <Flex w="full" direction="column" bg="white" boxShadow="md">
                        <Text px={5} py={3} fontSize="lg" fontWeight="700">Delivery Driver</Text>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                        <Flex w="full" p={6}>
                            <Flex w="full" direction="column" gap={3}>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Assign Delivery Driver</FormLabel>
                                    <Input
                                        variant="outline"
                                        value={deliveryDriver ? deliveryDriver.name : 'No driver assigned'}
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
                    <Flex w="full" direction="column" bg="white" boxShadow="md">
                        <Text px={5} py={3} fontSize="lg" fontWeight="700">Order Status</Text>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                        <Flex w="full" p={6}>
                            <Stepper index={activeStep} orientation='vertical' height='500px' gap='0'>
                                {steps.map((step, index) => (
                                    <Step key={index}>
                                        <StepIndicator>
                                            {step.isOnHold ? (
                                                <Box color="white" fontSize="lg" fontWeight="bold">
                                                    X
                                                </Box>
                                            ) : (
                                                <StepStatus
                                                    complete={<StepIcon />}
                                                    incomplete={<StepNumber />}
                                                    active={<StepNumber />}
                                                />
                                            )}
                                        </StepIndicator>

                                        <Box flexShrink='0'>
                                            <StepTitle color={step.isOnHold ? 'red.500' : 'inherit'}>
                                                {step.title}
                                            </StepTitle>
                                            <StepDescription color={step.isOnHold ? 'red.400' : 'inherit'}>
                                                {step.description}
                                            </StepDescription>
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

export default AdminOrderDetails;