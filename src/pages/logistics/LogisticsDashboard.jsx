import {
	Text,
    Flex,
    Box,
    Button,
    Divider,
    Badge,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { NavLink } from 'react-router-dom';
import { db } from "../../../api/firebase";
import { ref, get, } from "firebase/database";
import { FaEye } from 'react-icons/fa';
import { BarChart } from "../../components/charts/BarChart.jsx";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

function LogisticsDashboard() {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [readyForDeliveryOrders, setReadyForDeliveryOrders] = useState([]);
    const [shippingOrders, setShippingOrders] = useState([]);
    const [deliveredOrders, setDeliveredOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [ordersThisWeek, setOrdersThisWeek] = useState([]);
    const [deliveryDrivers, setDeliveryDrivers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const ordersRef = ref(db, "orders");
            const deliveryDriversRef = ref(db, "users");

            // Fetch orders and delivery drivers
            const [ordersSnapshot, driversSnapshot] = await Promise.all([
                get(ordersRef),
                get(deliveryDriversRef)
            ]);

            const orders = ordersSnapshot.val();
            const users = driversSnapshot.val();
            const deliveryDrivers = [];
            const driversMap = {};

            // Filter out delivery drivers and create a map of drivers by id
            for (let id in users) {
                const user = users[id];
                if (user.role === "Delivery") {
                    deliveryDrivers.push(user);
                    driversMap[user.uid] = user;
                }
            }

            const pendingOrders = [];
            const readyForDeliveryOrders = [];
            const shippingOrders = [];
            const deliveredOrders = [];
            const completedOrders = [];
            const ordersThisWeek = [];

            // Get the start and end of the current week
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Set to Monday
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Sunday
            endOfWeek.setHours(23, 59, 59, 999);

            // Process orders and link to drivers
            for (let id in orders) {
                const order = orders[id];
                order.id = id;

                const completionStatus = order.completion_status;

                // Check if the shipping_date is within this week
                const shippingDate = new Date(order.shipping_date);
                if (shippingDate >= startOfWeek && shippingDate <= endOfWeek) {
                    ordersThisWeek.push(order);
                }

                if (order.driver_id && driversMap[order.driver_id]) {
                    const driver = driversMap[order.driver_id];
                    if (!driver.orders) {
                        driver.orders = [];
                    }
                    driver.orders.push(order);
                }

                if (completionStatus?.Completed) {
                    completedOrders.push(order);
                } else if (completionStatus?.Arrived) {
                    deliveredOrders.push(order);
                } else if (completionStatus?.Shipping) {
                    shippingOrders.push(order);
                } else if (completionStatus?.ReadyForShipping) {
                    readyForDeliveryOrders.push(order);
                } else if (completionStatus?.Pending) {
                    pendingOrders.push(order);
                }
            }

            setPendingOrders(pendingOrders);
            setReadyForDeliveryOrders(readyForDeliveryOrders);
            setShippingOrders(shippingOrders);
            setDeliveredOrders(deliveredOrders);
            setCompletedOrders(completedOrders);
            setOrdersThisWeek(ordersThisWeek);
            setDeliveryDrivers(deliveryDrivers);
        };

        fetchData();
    }, []);

    const OrderStatusBarChart = () => {
        const chartData = {
            labels: ["Pending", "Ready for Delivery", "Shipping", "Delivered", "Completed"],
            datasets: [
                {
                    label: "Orders",
                    barPercentage: 0.5,
                    barThickness: 24,
                    maxBarThickness: 48,
                    minBarLength: 2,
                    data: [
                        pendingOrders.length,
                        readyForDeliveryOrders.length,
                        shippingOrders.length,
                        deliveredOrders.length,
                        completedOrders.length,
                    ],
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.2)",
                        "rgba(54, 162, 235, 0.2)",
                        "rgba(255, 206, 86, 0.2)",
                        "rgba(75, 192, 192, 0.2)",
                        "rgba(153, 102, 255, 0.2)",
                    ],
                    borderColor: [
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)",
                        "rgba(255, 206, 86, 1)",
                        "rgba(75, 192, 192, 1)",
                        "rgba(153, 102, 255, 1)",
                    ],
                    borderWidth: 1,
                },
            ],
        };
        
        const chartOptions = {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        };

        return <BarChart data={chartData} options={chartOptions} />;
    };

    const formatStatus = (status) => {
        if (status === "ReadyForShipping") {
            return "Ready For Shipping";
        }
        return status;
    };    

    const renderHeader = () => {
        // Calculate the number of available drivers
        const numAvailableDrivers = deliveryDrivers.filter(driver => driver.orders).length;
    
        return (
            <Flex w="full" alignItems="center" justifyContent="space-between">
                <Text fontSize="lg" fontWeight="700" color="#d69511">
                    Delivery Drivers
                </Text>
                <Button
                    colorScheme="blue"
                    size="sm"
                    pointerEvents="none"
                    _hover={{ cursor: "default" }} 
                >
                    Num. of Available Drivers: {numAvailableDrivers}
                </Button>
            </Flex>
        );
    };    

    const header = renderHeader();

    const statusBodyTemplate = (rowData) => {
        console.log(rowData);
        return (
            <Badge colorScheme={rowData.orders && rowData.orders.some(order => !order.completion_status?.Completed) ? "red" : "green"}>
                {rowData.orders && rowData.orders.some(order => !order.completion_status?.Completed) ? (
                    <Text fontSize="md" fontWeight="semibold" color="blue.500">Occupied</Text>
                ) : (
                    <Text fontSize="md" fontWeight="semibold" color="blue.500">Available</Text>
                )}
            </Badge>
        );
    }

    const actionBodyTemplate = (rowData) => {
        return (
            <Button bg='transparent' as={NavLink} to={`/view/${rowData.uid}`}><FaEye color='#0078ff'/></Button>
        );
    }

    return (
        <Flex w="full" h="auto" p={4} gap={7} bg="#f4f4f4" direction="column">
            <Flex w="full" gap={7} direction="row">
                <Flex w="70%" gap={6} direction="column">
                    <Flex w="full" bg='white' boxShadow='md' direction="column" gap={2}>
                        <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' mt={3} mx={3} textAlign='center'>
                            Order Status
                        </Text>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                        <OrderStatusBarChart />                            
                    </Flex>
                    <Flex w="full" bg='white' boxShadow='md' direction="column" gap={2} p={3}>
                        {
                            deliveryDrivers.length > 0 ? (
                                <DataTable 
                                    value={deliveryDrivers} 
                                    header={header} 
                                    paginator
                                    rows={5}
                                    rowsPerPageOptions={[5, 10, 15]}
                                    className="p-datatable-sm"
                                >
                                    <Column field="name" header="Name" sortable></Column>
                                    <Column field="email" header="Email" sortable></Column>
                                    <Column field="order" header="Status" sortable body={statusBodyTemplate}></Column>
                                    <Column field="action" header="Action" body={actionBodyTemplate}></Column>
                                </DataTable>
                            ) : (
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' color="gray.600" textAlign='center'>No delivery drivers available</Text>
                            )
                        }
                    </Flex>
                </Flex>
                <Flex w="30%" gap={6} direction="column">
                    <Flex w="full" bg='white' boxShadow='md' direction="column" gap={2}>
                        <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' color="gray.600" textAlign="center" mt={3}>Order Summary</Text>    
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>                    
                        <Flex w="full" direction="row" gap={2} p={4}>
                            <Flex w="70%" direction="column" gap={4}>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' color="red.600">Pending Orders</Text>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' color="blue.600">Ready For Delivery Orders</Text>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' color="yellow.600">Shipping Orders</Text>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' color="green.600">Delivered Orders</Text>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' color="purple.600">Completed Orders</Text>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' color="gray.600">Total Orders</Text>
                            </Flex>
                            <Flex w="30%" direction="column" gap={4}>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide'>{pendingOrders.length}</Text>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide'>{readyForDeliveryOrders.length}</Text>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide'>{shippingOrders.length}</Text>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide'>{deliveredOrders.length}</Text>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide'>{completedOrders.length}</Text>
                                <Text fontSize='md' fontWeight='semibold' letterSpacing='wide'>{pendingOrders.length + readyForDeliveryOrders.length + shippingOrders.length + deliveredOrders.length + completedOrders.length}</Text>
                            </Flex>
                        </Flex>
                    </Flex>
                    <Flex w="full" bg='white' boxShadow='md' direction='column' gap={2} p={3}>
                        <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' color="gray.600">Orders This Week</Text>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>
                        <Flex w="full" direction="column" gap={2}>
                            {ordersThisWeek.map((order, index) => (
                                <NavLink to={`/order-details/${order.id}`} key={index}>
                                    <Box 
                                        bg="white" 
                                        p={4} 
                                        borderRadius="md" 
                                        boxShadow="md"
                                        transition="transform 0.2s"
                                        _hover={{ transform: "scale(1.02)" }}
                                        cursor="pointer"
                                    >
                                        <Flex w="full" direction="column">
                                            <Flex w="full" direction="row" justifyContent="space-between">
                                                <Text fontSize='sm' fontWeight='semibold'>{order.order_id}</Text>
                                                <Badge colorScheme="green">
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
                                                </Badge>
                                            </Flex>
                                            <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300" my={1}/>
                                            <Flex w="full" direction="column" gap={2}>
                                                <Text fontSize='sm' fontWeight='semibold'>{order?.customer?.name}</Text>
                                                <Text fontSize='sm' fontWeight='semibold'>{order?.address?.address}</Text>
                                                <Text fontSize='sm' fontWeight='semibold'>{order?.shipping_date}</Text>
                                            </Flex>
                                        </Flex>
                                    </Box>
                                </NavLink>
                            ))}
                            {ordersThisWeek.length === 0 && (
                                <Text fontSize='sm' fontWeight='semibold' color="gray.600">No orders this week</Text>
                            )}
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
}

export default LogisticsDashboard;