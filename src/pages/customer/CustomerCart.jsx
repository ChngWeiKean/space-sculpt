import {
	Text,
    Flex,
    Box,
    Button,
    useToast,
    Divider,
    Badge,
    Alert,
    AlertIcon,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { FaPlus, FaTrash, FaMinus } from "react-icons/fa6";
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from "../../components/AuthCtx.jsx";
import { db } from "../../../api/firebase";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import { onValue, ref } from "firebase/database";
import { removeFromCart, updateCart } from "../../../api/customer.js";

function CustomerCart() {
    const { user } = useAuth();
    const [cart, setCart] = useState([]);
    const [furniture, setFurniture] = useState([]);

    useEffect(() => {
        const userRef = ref(db, `users/${user?.uid}`);
        onValue(userRef, (snapshot) => {
            const user = snapshot.val();
            const cartData = snapshot.val().cart;
            if (snapshot.val().cart) {
                Object.keys(cartData).forEach((key) => {
                    cartData[key].id = key;
                });                    
            }
    
            setCart(cartData);
        });        
    }, [user]);

    useEffect(() => {
        const fetchFurnitureDetails = async () => {
            try {
                const items = Object.values(cart);
                let furniture = [];

                const promises = items.map((item) => {
                    return new Promise((resolve, reject) => {
                        const itemRef = ref(db, `furniture/${item.furnitureId}`);
    
                        onValue(itemRef, (snapshot) => {
                            if (snapshot.exists()) {
                                const furnitureData = snapshot.val();
    
                                if (furnitureData.variants && furnitureData.variants[item.variantId]) {
                                    const variantData = furnitureData.variants[item.variantId];
                                    const furnitureItem = {
                                        id: snapshot.key,
                                        quantity: item.quantity,
                                        added_on: item.created_on,
                                        image: variantData.image,
                                        color: variantData.color,
                                        inventory: variantData.inventory,
                                        variantId: item.variantId,
                                        cartId: item.id,
                                        ...furnitureData 
                                    };
                                    furniture.push(furnitureItem);
                                }
                            }
                            resolve();
                        }, (error) => {
                            reject(error);
                        });
                    });
                });

                await Promise.all(promises);
                console.log("Furniture details:", furniture);

                setFurniture(furniture);
            } catch (error) {
                console.error('Error fetching furniture details:', error);
            }
        };
    
        fetchFurnitureDetails();
    }, [cart]);

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
                                    <Text>{discountedPrice}</Text>                
                                </Flex>                            
                                <Text fontWeight={600} color={"red"} textDecoration="line-through">{rowData.price}</Text>                                
                            </Flex>   
                            <Text fontSize="sm" color="#d69511">-{rowData.discount}% Discount</Text>                         
                        </Flex>

                    ) : (
                        <Flex direction="row" gap={2}>
                            <Text fontWeight={600} color={"green"}>RM</Text>
                            <Text>{rowData.price}</Text>                
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

    const toast = useToast();

    const handleIncrement = async (rowData) => {
        const updatedQuantity = rowData.quantity + 1;
        rowData.quantity = updatedQuantity;

        if (updatedQuantity > rowData.inventory) {
            toast({
                title: "Out of Stock",
                description: "You have reached the maximum quantity available for this item.",
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        await updateCart(rowData.id, user.uid, updatedQuantity, rowData.cartId);
    };
    
    const handleDecrement = async (rowData) => {
        if (rowData.quantity > 1) {
            const updatedQuantity = rowData.quantity - 1;
            rowData.quantity = updatedQuantity;
            await updateCart(rowData.id, user.uid, updatedQuantity, rowData.cartId);
        }
    };

    const handleRemove = async (rowData) => {
        try {
            await removeFromCart(rowData.id, user.uid, rowData.cartId);
            toast({
                title: "Item removed from cart",
                status: "success",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
            console.log(cart)
        } catch (error) {
            console.error("Error removing item from cart:", error);
            toast({
                title: "Error removing item from cart",
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const quantityBodyTemplate = (rowData) => {
        return (
            <Flex w="full" direction="row" gap={5} alignItems="center">
                {
                    rowData.quantity > 1 && rowData.inventory > 0 ? (
                        <Box transition="transform 0.2s" _hover={{ transform: 'scale(1.2)' }} onClick={() => handleDecrement(rowData)}>
                            <FaMinus />
                        </Box>                        
                    ) : (
                        <Box>
                            <FaMinus />
                        </Box>    
                    )   
                }
                <Text fontWeight={600}>{rowData.quantity}</Text>
                {
                    rowData.inventory > 0 ? (
                        <Box transition="transform 0.2s" _hover={{ transform: 'scale(1.2)' }} onClick={() => handleIncrement(rowData)}>
                            <FaPlus />
                        </Box>
                    ) : (
                        <Box>
                            <FaPlus />
                        </Box>    
                    )
                }
            </Flex>
        );
    }

    const navigate = useNavigate();

    const handleCheckout = () => {
        const items = furniture.filter((item) => item.inventory > 0);
        navigate('/cart/checkout', { state: items });
    }

    return (
        <Flex w="full" minH="full" p={4} gap={7} bg="#f4f4f4" direction="column" alignItems="center">
            <Box w="90%" h="full" bg="white" boxShadow="md" p={10}> 
                <Flex w="full" direction="column">
                    <Flex w="full" direction="row" alignItems="center" gap={4}>
                        <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                        <Text fontSize="2xl" fontWeight="700" color="#d69511">Shopping Cart</Text>  
                    </Flex>
                    <Divider my={5}/>
                    {
                        furniture.some((item) => item.inventory == 0) ? (
                            <Flex w="full" direction="row" mb={5}>
                                <Alert status="warning" size={"lg"}>
                                    <AlertIcon />
                                    <Text fontSize="sm" fontWeight="semibold">
                                        Some items in your cart are out of stock. Items will not be considered for checkout.
                                    </Text>
                                </Alert>
                            </Flex>
                        ) : null
                    }
                    {
                        !cart ? (
                            <Flex w="full" direction="column" alignItems="center" gap={4}>
                                <Text fontSize="xl" fontWeight="700">Your cart is empty</Text>
                                <Text fontSize="lg" fontWeight="400">Looks like you haven't added anything to your cart yet</Text>
                                <Button colorScheme="blue" size="lg" as={NavLink} to={'/'}>Start Shopping</Button>
                            </Flex>
                        ) : (
                            <Flex w="full" direction="row">
                                <Flex w="70%" direction="row" alignItems="center" gap={4}>
                                    <Box w="full">
                                        <DataTable value={furniture}>
                                            <Column field="name" header="Furniture" body={nameBodyTemplate}></Column>
                                            <Column field="color" header="Variant"></Column>
                                            <Column field="price" header="Price" body={priceBodyTemplate}></Column>
                                            <Column field="quantity" header="Quantity" body={quantityBodyTemplate}></Column>
                                            <Column field="total" header="Total" body={totalBodyTemplate}></Column>
                                            <Column field="action" body={(rowData) => (
                                                <Flex w="full" direction="row" alignItems="center" gap={4}>
                                                    <Button colorScheme="red" size="sm" onClick={() => handleRemove(rowData)}><FaTrash/></Button>
                                                </Flex>
                                            )}></Column>
                                        </DataTable>
                                    </Box>
                                </Flex>
                                <Flex w="30%" direction="column" alignItems="center" pl={10} gap={5}>
                                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                    <Text fontSize="xl" fontWeight="600">Order Summary</Text>
                                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                    {
                                        furniture
                                            .slice() 
                                            .sort((a, b) => new Date(a.added_on) - new Date(b.added_on))
                                            .filter((item) => item.inventory > 0)
                                            .map((item) => (
                                            <Flex w="full" direction="row" justifyContent="space-between" key={item.id}>
                                                <Text fontSize="md">{item.name} ({item.color})</Text>
                                                {
                                                    item.discount > 0 ? (
                                                        <Text fontSize="md">RM {((item.price - (item.price * item.discount / 100)) * item.quantity).toFixed(2)}</Text>
                                                    ) : <Text fontSize="md">RM {(item.price * item.quantity).toFixed(2)}</Text>
                                                }
                                            </Flex>
                                        ))
                                    }
                                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                    <Flex w="full" direction="row" justifyContent="space-between">
                                        <Text fontSize="lg" fontWeight="700">Total</Text>
                                        <Text fontSize="lg" fontWeight="700">
                                            RM {
                                                furniture.reduce((acc, item) => {
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
                                    <Button w="full" colorScheme="blue" size="lg" onClick={handleCheckout} style={{ outline:'none' }}>Checkout</Button>
                                </Flex>                                
                            </Flex>
                        )
                    }
                </Flex>
            </Box>
        </Flex>
    )
}

export default CustomerCart;