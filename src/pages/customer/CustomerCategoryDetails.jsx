import {
	Text,
    Flex,
    Box,
    Button,
    Avatar,
    Menu,
    MenuButton,
    Divider,
    MenuList,
    MenuItem,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
    Select,
    useToast,
    SimpleGrid,
    Badge,
} from "@chakra-ui/react";
import {useRef, useState, useEffect, memo, useCallback} from "react";
import { IoBedOutline, IoCartOutline } from "react-icons/io5";
import { GiMoneyStack } from "react-icons/gi";
import { GrTransaction } from "react-icons/gr";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import { MdOutlineSell, MdOutlineInventory } from "react-icons/md";
import { CiWarning } from "react-icons/ci";
import { GoSmiley } from "react-icons/go";
import { RiArrowGoBackFill } from "react-icons/ri";
import { db } from "../../../api/firebase";
import {useAuth} from "../../components/AuthCtx.jsx";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import { onValue, query, ref, orderByChild, equalTo, get } from "firebase/database";
import { FaStar, FaStarHalf, FaUser, FaStethoscope, FaClinicMedical, FaEye, FaTrash } from "react-icons/fa";
import { BiSearchAlt2 } from "react-icons/bi";
import { AiOutlineUser, AiOutlineSafetyCertificate } from "react-icons/ai";
import { NavLink, useParams } from 'react-router-dom';
import { addToFavourites, addToCart } from "../../../api/customer";

function CustomerCategoryDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const [category, setCategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [furniture, setFurniture] = useState([]);
    const [furnitureIds, setFurnitureIds] = useState([]);
    const [searchSubcategoryQuery, setSearchSubcategoryQuery] = useState("");
    const [searchFurnitureQuery, setSearchFurnitureQuery] = useState("");
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);

    useEffect(() => {
        const categoryRef = ref(db, `categories/${id}`);
        onValue(categoryRef, (snapshot) => {
            setCategory(snapshot.val());
        });

        const subcategoryRef = query(ref(db, 'subcategories'), orderByChild('category'), equalTo(id));
        onValue(subcategoryRef, (snapshot) => {
            const subcategories = [];
            const furnitureIds = []
            snapshot.forEach((subcategorySnapshot) => {
                const subcategoryData = {
                    id: subcategorySnapshot.key,
                    ...subcategorySnapshot.val()
                }
                subcategories.push(subcategoryData);
                subcategorySnapshot.val().furniture?.forEach((furnitureId) => {
                    furnitureIds.push(furnitureId);
                });
            });
            setSubcategories(subcategories);
            setFurnitureIds(furnitureIds);
        });
    }, [id]);

    useEffect(() => {
        const userRef = ref(db, `users/${user?.uid}`);
        onValue(userRef, (snapshot) => {
            const user = snapshot.val();
            setCart(user?.cart || []);
        });        
    }, [user]);

    useEffect(() => {
        const furnitureRef = ref(db, 'furniture');
        onValue(furnitureRef, (snapshot) => {
            const furniture = [];
            snapshot.forEach((furnitureSnapshot) => {
                if (furnitureIds.includes(furnitureSnapshot.key)) {
                    const subcategoryRef = ref(db, `subcategories/${furnitureSnapshot.val().subcategory}`);
                    get(subcategoryRef).then((subcategorySnapshot) => {
                        const subcategory = subcategorySnapshot.val().name;
                        console.log(subcategory);
                        furniture.push({
                            id: furnitureSnapshot.key,
                            subcategoryName: subcategory,
                            ...furnitureSnapshot.val()
                        });
                        setFurniture(furniture);
                    }).catch((error) => {
                        console.error("Error fetching subcategory name:", error);
                    });
                }
            });
        });
    }, [furnitureIds]);

    const filteredSubcategories = subcategories.filter((subcategory) =>
        subcategory.name.toLowerCase().includes(searchSubcategoryQuery.toLowerCase())
    );

    const handleSubcategoryClick = (subcategory) => {
        setSelectedSubcategory(subcategory);
    };

    const filteredFurniture = selectedSubcategory
        ? furniture.filter((item) => item.subcategory === selectedSubcategory.id)
        : furniture;

    const PriceTemplate = (rowData) => {
        console.log(rowData);
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
                            <Flex direction="row" gap={3}>
                                <Flex direction="row" gap={2}>
                                    <Text fontWeight={600} fontSize="md" color={"green"}>RM</Text>
                                    <Text fontWeight={600} fontSize="xl">{discountedPrice}</Text>                
                                </Flex>                            
                                <Text fontWeight={600} fontSize="xl" color={"red"} textDecoration="line-through">{rowData.price}</Text>                                
                            </Flex>                       
                        </Flex>
    
                    ) : (
                        <Flex direction="row" gap={2}>
                            <Text fontWeight={600} fontSize="md" color={"green"}>RM</Text>
                            <Text fontWeight={600} fontSize="xl">{rowData.price}</Text>                
                        </Flex>                        
                    )
                }
            </Flex>
        );
    }

    const DimensionTemplate = (rowData) => {
        return (
            <Flex>
                <Text color="gray.500" fontWeight={500} fontSize="sm">{rowData.width} x {rowData.height} x {rowData.length} cm</Text>
            </Flex>
        );
    }

    const toggleLike = async (furnitureId) => {
        await addToFavourites(furnitureId, user?.uid);
    }

    const toast = useToast();

    const addFurnitureToCart = async (furnitureId, furnitureName) => {
        try {
            await addToCart(furnitureId, user?.uid);
            toast({
                title: "Added to cart",
                description: furnitureName + " has been added to your cart.",
                status: "success",
                position: "top",
                duration: 9000,
                isClosable: true,
            });            
        } catch (error) {
            console.error("Error adding to cart:", error);
            toast({
                title: "Error adding to cart",
                description: "An error occurred while adding " + furnitureName + " to your cart.",
                status: "error",
                position: "top",
                duration: 9000,
                isClosable: true,
            });
        }
    }

    return (
        <Flex w="full" h="full" p={4} gap={7} bg="#f4f4f4" direction="column">
            <Flex w="full" h="14rem" direction="row" gap={4}>
                <Flex direction="column" gap={1}>
                    <Text ml={2} color="#d69511" fontSize="xl" fontWeight="bold" textAlign="center">Category</Text>
                    <Flex direction="row" gap={4} alignItems="center">
                        <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                        <Box onClick={() => handleSubcategoryClick(null)} direction="column" alignItems="center" minW="200px" minH="200px" maxW="200px" maxH="200px" transition="transform 0.2s" _hover={{ transform: 'scale(1.05)', color: '#d69511' }}>
                            <img src={category?.image} alt={category?.name} style={{ width: "100%", height: "80%", objectFit: "contain" }} />
                            <Text mt={1} textAlign="center" fontSize="md" fontWeight="600">{category?.name}</Text>
                        </Box>                           
                    </Flex>
                </Flex>

                <Divider h="full" borderWidth="1px" variant="solid" orientation="vertical" borderColor="gray.500"/>
                
                <Flex direction="column" w="full">
                    <Flex w="full" direction="row" justifyContent="space-between">
                        <Text ml={2} color="#d69511" fontSize="xl" fontWeight="bold">Subcategories</Text>
                        <Box>
                            <InputGroup>
                                <InputLeftElement
                                    pointerEvents="none"
                                    children={<BiSearchAlt2 color="gray.300" />}
                                />
                                <Input
                                    w="full"
                                    placeholder="Search subcategory..."
                                    size="md"
                                    focusBorderColor="blue.500"
                                    borderRadius="lg"
                                    borderColor="gray.300"
                                    backgroundColor="white"
                                    color="gray.800"
                                    value={searchSubcategoryQuery}
                                    onChange={(e) => setSearchSubcategoryQuery(e.target.value)}
                                />
                            </InputGroup>
                        </Box>  
                    </Flex>
                    
                    <Flex 
                        direction="row" 
                        gap={5} 
                        pb={5}
                        overflowX="scroll"
                        overflowY="hidden"
                        sx={{ 
                            '&::-webkit-scrollbar': {
                                height: '7px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: '#092654',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: '#f1f1f1',
                            },
                        }}
                    >
                        {filteredSubcategories?.map((subcategory, index) => (
                            <Box key={index} onClick={() => handleSubcategoryClick(subcategory)} direction="column" alignItems="center" minW="200px" minH="200px" maxW="200px" maxH="200px" transition="transform 0.2s" _hover={{ transform: 'scale(1.05)', color: '#d69511' }}>
                                <img src={subcategory?.image} alt={subcategory?.name} style={{ width: "100%", height: "80%", objectFit: "contain" }} />
                                <Text mt={1} textAlign="center" fontSize="md" fontWeight="600" >{subcategory?.name}</Text>
                            </Box>    
                        ))}
                    </Flex>                       
                </Flex>
            </Flex>

            <Flex w="full" h="auto" direction="column" gap={5}>
                <Flex w="30%">
                    <InputGroup>
                        <InputLeftElement
                            pointerEvents="none"
                            children={<BiSearchAlt2 color="gray.300" />}
                        />
                        <Input
                            w="full"
                            placeholder="Search furniture..."
                            size="md"
                            focusBorderColor="blue.500"
                            borderRadius="lg"
                            borderColor="gray.300"
                            backgroundColor="white"
                            color="gray.800"
                            value={searchFurnitureQuery}
                            onChange={(e) => setSearchFurnitureQuery(e.target.value)}
                        />
                    </InputGroup>
                </Flex>  
                <SimpleGrid
                    columns={[1, 1, 2, 3, 4]}
                    gap={10}
                    p={3}
                >
                    {filteredFurniture
                        .filter((furniture) =>
                            furniture.name.toLowerCase().includes(searchFurnitureQuery.toLowerCase())
                        )
                        .map((furniture, index) => (
                        <Box as={NavLink} to={`/furniture/${furniture.id}/details`} key={index} direction="column" alignItems="center" minW="340px" minH="480px" maxW="340px" maxH="480px" transition="transform 0.2s" _hover={{ color: '#d69511'}}>
                            <img src={furniture.image} alt={furniture.name} style={{ width: "100%", height: "70%", objectFit: "contain" }} />
                            <Flex w="full" mt={3} justifyContent="space-between">
                                <Box display='flex' alignItems='center'>
                                    {
                                        Array(5)
                                            .fill('')
                                            .map((_, i) => (
                                                i < Math.floor(furniture?.ratings) ? (
                                                <FaStar key={i} color='#d69511' />
                                                ) : (
                                                i === Math.floor(furniture?.ratings) && furniture?.ratings % 1 !== 0 ? (
                                                    <FaStarHalf key={i} color='#d69511' />
                                                ) : (
                                                    <FaStar key={i} color='gray' />
                                                )
                                                )
                                            ))
                                    }
                                    <Box as='span' ml='2' color='gray.600' fontSize='sm'>
                                        {furniture?.ratings || 0} ratings
                                    </Box>
                                </Box>              
                                <Flex gap={2} alignItems="center" color='red' onClick={() => toggleLike(furniture?.id)} transition="transform 0.2s" _hover={{ transform: 'scale(1.2)' }}>
                                    {user?.favourites?.includes(furniture?.id) ? <IoIosHeart size={"25px"}/> : <IoIosHeartEmpty size={"25px"}/>} <Text fontSize="sm">({furniture?.favourites?.length || 0})</Text>
                                </Flex>
                            </Flex>
                            <Flex w="full" direction="row" alignItems="center" justifyContent="space-between" mt={2}>
                                <Text fontSize="xl" fontWeight="700">{furniture.name}</Text>
                                {
                                    furniture?.discount > 0 ? (
                                        <Badge colorScheme="red" fontSize="md" color="red">-{furniture?.discount}%</Badge>   
                                    ) : null
                                }
                            </Flex>
                            <Flex w="full" direction="row" alignItems="center" gap={2}>
                                <Text fontSize="sm" fontWeight="500" color="gray.500">{furniture?.subcategoryName}</Text>
                                <Divider h="1rem" borderWidth="1px" variant="solid" orientation="vertical" borderColor="gray.500"/>
                                <DimensionTemplate {...furniture}/>
                            </Flex>
                            
                            <Flex direction="row" my={2}>
                                <PriceTemplate {...furniture}/>
                            </Flex>

                            {
                                cart?.find((item) => item.id === furniture.id) ? (
                                    <Flex w="full" direction="row" justifyContent="center" gap={2}>
                                        <Button w="full" colorScheme="green" variant="solid" size="md" leftIcon={<IoCartOutline />}>Already In Cart</Button>
                                    </Flex>
                                ) : (
                                    <Flex w="full" direction="row" justifyContent="center" gap={2}>
                                        <Button w="full" colorScheme="blue" variant="solid" size="md" leftIcon={<IoCartOutline />} onClick={() => addFurnitureToCart(furniture.id, furniture.name)}>Add to Cart</Button>
                                    </Flex>
                                )
                            }
                        </Box>
                    ))}
                </SimpleGrid>
            </Flex>            
        </Flex>
    );
}

export default CustomerCategoryDetails;