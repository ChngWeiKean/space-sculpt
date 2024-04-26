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
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill } from "react-icons/bs";
import { RxCross1, RxHeight, RxWidth, RxSize, RxDimensions } from "react-icons/rx";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline, IoCartOutline } from "react-icons/io5";
import { CiWarning } from "react-icons/ci";
import { GoSmiley } from "react-icons/go";
import { GrThreeD } from "react-icons/gr";
import { FaImage, FaRegFileImage } from "react-icons/fa6";
import { AiOutlineDash } from "react-icons/ai";
import { FaPlus, FaTrash, FaStar, FaStarHalf, FaMinus } from "react-icons/fa6";
import { MdOutlineInventory, MdOutlineTexture } from "react-icons/md";
import { Form, useForm } from "react-hook-form";
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from "../../components/AuthCtx.jsx";
import { db } from "../../../api/firebase";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import { onValue, ref, query, orderByChild, equalTo, set } from "firebase/database";
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
                                        image: variantData.image,
                                        color: variantData.color,
                                        inventory: variantData.inventory,
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
            <Flex w="full" direction="row" alignItems="center" gap={8}>
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
            discountedPrice = price - (price * discount / 100);
        } else {
            discountedPrice = price;
        }

        return (
            <Flex w="full" direction="row" gap={2} >
                <Flex direction="row" gap={2}>
                    <Text fontWeight={600} color={"green"}>RM</Text>
                    <Text>{discountedPrice * rowData.quantity}</Text>                
                </Flex>                        
            </Flex>
        );
    }

    const toast = useToast();

    const handleIncrement = async (rowData) => {
        console.log("Incrementing");
        const updatedQuantity = rowData.quantity + 1;
        rowData.quantity = updatedQuantity;
        await updateCart(rowData.id, user.uid, updatedQuantity, rowData.cartId);
    };
    
    const handleDecrement = async (rowData) => {
        console.log("Decrementing");
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
                <Box transition="transform 0.2s" _hover={{ transform: 'scale(1.2)' }} onClick={() => handleDecrement(rowData)}>
                    {
                        rowData.quantity > 1 ? (
                            <FaMinus />
                        ) : null
                    }
                </Box>
                <Text fontWeight={600}>{rowData.quantity}</Text>
                <Box transition="transform 0.2s" _hover={{ transform: 'scale(1.2)' }} onClick={() => handleIncrement(rowData)}>
                    <FaPlus />
                </Box>
            </Flex>
        );
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
                        !cart ? (
                            <Flex w="full" direction="column" alignItems="center" gap={4}>
                                <Text fontSize="xl" fontWeight="700">Your cart is empty</Text>
                                <Text fontSize="lg" fontWeight="400">Looks like you haven't added anything to your cart yet</Text>
                                <Button colorScheme="blue" size="lg" onClick={() => window.history.back()}>Start Shopping</Button>
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
                                <Flex w="30%" direction="column" alignItems="center" px={10} gap={5}>
                                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                    <Text fontSize="xl" fontWeight="600">Order Summary</Text>
                                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                    {
                                        furniture.map((item) => (
                                            <Flex w="full" direction="row" justifyContent="space-between" key={item.id}>
                                                <Text fontSize="lg">{item.name}</Text>
                                                {
                                                    item.discount > 0 ? (
                                                        <Text fontSize="lg">RM {(item.price - (item.price * item.discount / 100)) * item.quantity}</Text>
                                                    ) : <Text fontSize="lg">RM {item.price * item.quantity}</Text>
                                                }
                                            </Flex>
                                        ))
                                    }
                                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                    <Flex w="full" direction="row" justifyContent="space-between">
                                        <Text fontSize="lg" fontWeight="700">Total</Text>
                                        <Text fontSize="lg" fontWeight="700">RM {furniture.reduce((acc, item) => {
                                            if (item.discount > 0) {
                                                return acc + ((item.price - (item.price * item.discount / 100)) * item.quantity);
                                            } else {
                                                return acc + (item.price * item.quantity);
                                            }
                                        }, 0)}</Text>
                                    </Flex>
                                    <Button w="full" colorScheme="blue" size="lg">Checkout</Button>
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