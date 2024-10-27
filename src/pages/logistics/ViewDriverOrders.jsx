import {
    Box,
    Button,
    Center,
    Flex,
    Text,
} from '@chakra-ui/react';
import { db } from "../../../api/firebase";
import { useEffect, useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FaEye } from 'react-icons/fa';
import { onValue, ref } from "firebase/database";
import { Link, useParams } from 'react-router-dom';

function ViewDriverOrders() {
    const { id } = useParams();
    const [ user, setUser ] = useState({});
    const [ orderData, setOrderData ] = useState([]);

    useEffect(() => {
        const userRef = ref(db, `users/${id}`);
    
        // Listen to the user data
        const unsubscribeUser = onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            setUser(data);
    
            // Fetch orders once user data is available
            if (data?.pending_orders?.length) {
                const orderData = [];
    
                // Loop through each pending order and fetch the order data
                data.pending_orders.forEach((orderId) => {
                    const orderRef = ref(db, `orders/${orderId}`);
    
                    onValue(orderRef, (orderSnapshot) => {
                        const order = orderSnapshot.val();
                        order.id = orderId;
                        if (order) {
                            orderData.push(order);
                        }
                        // After all orders are fetched, update state
                        if (orderData.length === data.pending_orders.length) {
                            setOrderData(orderData);
                        }
                    }, (error) => {
                        console.error("Error fetching order data: ", error);
                    });
                });
            }
        }, (error) => {
            console.error("Error fetching user data: ", error);
        });
    
        // Clean up the listener when the component unmounts
        return () => {
            unsubscribeUser();
        };
    }, [id]);

    const statusBodyTemplate = (rowData) => {
        const statusMapping = {
            'Pending': 'Order Placed',
            'ReadyForShipping': 'Ready For Shipping',
            'Shipping': 'Shipped',
            'Arrived': 'Delivered',
            'Resolved': 'Resolved',
            'Completed': 'Completed',
            'OnHold': 'On Hold'
        };

        let status;
        if (rowData.completion_status) {
            const statusEntries = Object.entries(rowData.completion_status);
            status = statusEntries.sort(([ , aTimestamp], [ , bTimestamp]) => new Date(bTimestamp) - new Date(aTimestamp))[0][0];
        }

        return (
            <Text>{statusMapping[status]}</Text>
        );
    }

    return (
        <Flex w="full" bg="#f4f4f4" direction="column" alignItems="center" position="relative">
            <Flex w="full" direction="column" p={4}>
                <Center w="full" h="full" bg={"#f4f4f4"}>
                    <Box w='85%' my={6}>
                        <Flex 	
                            w="full"
                            bg="white"
                            boxShadow="xl"
                            rounded="xl"
                            p={3}
                        >
                            <Flex my={7} mx={5} w="full" direction="column" gap={2}>
                                <Flex w="full" direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                                    <Flex w="auto" direction="row" alignContent="center" gap={4}>
                                        <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()} />
                                        <Text fontSize="lg" fontWeight="700" color="#d69511">List of Orders for {user?.name}</Text>
                                    </Flex>
                                </Flex>
                                <Flex w="full" direction="column">
                                    <DataTable value={orderData} className="p-datatable-sm" paginator rows={10}>
                                        <Column field="order_id" header="Order ID" sortable></Column>
                                        <Column field="shipping_date" header="Date" sortable></Column>
                                        <Column field="shipping_time" header="Time" sortable></Column>
                                        <Column field="total" header="Total" sortable></Column>
                                        <Column field="status" header="Status" sortable body={statusBodyTemplate}></Column>
                                        <Column field="actions" header="Actions" body={(rowData) => {
                                            return (
                                                <Link to={`/order-details/${rowData.id}`}>
                                                    <Button colorScheme="blue" size="sm" leftIcon={<FaEye />} variant="solid">View</Button>
                                                </Link>
                                            );
                                        }}></Column>
                                    </DataTable>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Box>
                </Center>
            </Flex>
        </Flex>
    );
}

export default ViewDriverOrders;
