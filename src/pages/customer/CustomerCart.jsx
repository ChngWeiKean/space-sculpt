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
import { FaPlus, FaTrash, FaStar, FaStarHalf } from "react-icons/fa6";
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

function CustomerCart() {
    const { user } = useAuth();
    const [cart, setCart] = useState([]);
    const [furniture, setFurniture] = useState([]);

    useEffect(() => {
        const userRef = ref(db, `users/${user?.uid}`);
        onValue(userRef, (snapshot) => {
            const user = snapshot.val();
            setCart(user?.cart || []);
        });        
    }, [user]);

    useEffect(() => {
        const furnitureRef = ref(db, `furniture`);
        onValue(furnitureRef, (snapshot) => {
            let furniture = [];
            snapshot.forEach((child) => {
                let data = {
                    id: child.key,
                    ...child.val()
                };
                if (cart?.find((item) => item.id === data.id)) {
                    data.quantity = cart.find((item) => item.id === data.id).quantity;
                    furniture.push(data);
                }
            });
            setFurniture(furniture);
        });
    }, [cart]);

    const nameBodyTemplate = (rowData) => {
        return (
            <Flex w="full" direction="row" alignItems="center" gap={4}>
                <img src={rowData?.image} alt={rowData?.name} style={{ width: "100px", height: "100px", objectFit: "contain" }} />
                <Flex w="full" direction="column" gap={2}>
                    <Text fontSize="lg" fontWeight="700">{rowData.name}</Text>
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
            <Flex w="full" direction="row" gap={2}>
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

    return (
        <Flex w="full" h="full" p={4} gap={7} bg="#f4f4f4" direction="column" alignItems="center">
            <Box w="90%" h="full" bg="white" boxShadow="md" p={10}> 
                <Flex w="full" direction="column">
                    <Flex w="full" direction="row" alignItems="center" gap={4}>
                        <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                        <Text fontSize="2xl" fontWeight="700" color="#d69511">Shopping Cart</Text>  
                    </Flex>
                    <Divider my={5}/>
                    <Flex w="70%" direction="row" alignItems="center" gap={4}>
                        {
                            cart.length > 0 ? (
                                <Box w="full">
                                    <DataTable 
                                        value={furniture}
                                    >
                                        <Column field="name" header="Furniture" body={nameBodyTemplate}></Column>
                                        <Column field="price" header="Price" body={priceBodyTemplate}></Column>
                                        <Column field="quantity" header="Quantity"></Column>
                                        <Column field="total" header="Total"></Column>
                                        <Column field="action" header="Actions" body={(rowData) => (
                                            <Flex w="full" direction="row" alignItems="center" gap={4}>
                                                <Button colorScheme="red" size="sm"><FaTrash/></Button>
                                            </Flex>
                                        )}></Column>
                                    </DataTable>
                                </Box>
                            ) : (
                                <Flex w="full" direction="column" alignItems="center" gap={4}>
                                    <Text fontSize="lg" fontWeight="700">Your cart is empty</Text>
                                    <Text fontSize="md" fontWeight="400">Please add items to your cart</Text>
                                </Flex>
                            )
                        }
                    </Flex>
                    <Flex w="30%" direction="column" alignItems="center" gap={4}>

                    </Flex>
                </Flex>
            </Box>
        </Flex>
    )
}

export default CustomerCart;