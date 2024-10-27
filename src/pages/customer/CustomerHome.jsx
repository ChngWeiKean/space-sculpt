import {
    Button,
    Flex,
	Text,
    Box,
    Input,
    InputGroup,
    InputLeftElement,
    Divider,
    Badge,
    Tooltip,
    useToast,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FaStar, FaStarHalf } from "react-icons/fa";
import { GoArrowRight } from "react-icons/go";
import { IoIosHeart, IoIosHeartEmpty } from "react-icons/io";
import { RiEmotionHappyLine } from "react-icons/ri";
import { IoBedOutline, IoCartOutline } from "react-icons/io5";
import { AiOutlineUser } from "react-icons/ai";
import { BiSearchAlt2, BiCategoryAlt } from "react-icons/bi";
import { NavLink } from 'react-router-dom';
import { db } from "../../../api/firebase";
import { onValue, ref } from "firebase/database";
import { useAuth } from "../../components/AuthCtx";
import { addToFavourites, addToCart } from "../../../api/customer";

function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
}

function CustomerHome() {
    const { user } = useAuth();
    const [ categories, setCategories ] = useState([]);
    const [ furniture, setFurniture ] = useState([]);
    const [ topFurniture, setTopFurniture ] = useState([]);
    const [ numOfCategories, setNumOfCategories ] = useState(0);
    const [ cart, setCart ] = useState({});
    const [ furnitureLength, setFurnitureLength ] = useState(0);
    const [ searchQuery, setSearchQuery ] = useState('');

    useEffect(() => {
        const categoryRef = ref(db, 'categories');
        onValue(categoryRef, (snapshot) => {
            const categories = [];
            snapshot.forEach((childSnapshot) => {
                const data = {
                id: childSnapshot.key,
                    ...childSnapshot.val(),
                };
                categories.push(data);
            });
            setNumOfCategories(categories.length);
            setCategories(categories);
        });

        const furnitureRef = ref(db, 'furniture');
        onValue(furnitureRef, (snapshot) => {
            const furniture = [];
            let order_length = 0;
            snapshot.forEach((childSnapshot) => {
                const data = {
                    id: childSnapshot.key,
                    ...childSnapshot.val(),
                };
                console.log(data);
                const variants = Object.values(data.variants);
                data.mainImage = variants.length > 0 ? variants.find((variant) => variant.inventory > 0).image : null;
                data.selectedVariant = variants.length > 0 ? Object.keys(childSnapshot.val().variants).find((variant) => childSnapshot.val().variants[variant].inventory > 0) : null;
                data.selectedColor = variants.length > 0 ? variants.find((variant) => variant.inventory > 0).color : null;
                if (data.orders) {
                    order_length = Object.keys(data.orders).length;
                } else {
                    order_length = 0;
                }
                data.order_length = order_length;
                data.ratings = 0;
                if (childSnapshot.val().reviews) {
                    data.ratings = Object.values(childSnapshot.val().reviews).reduce((acc, review) => acc + review.rating, 0) / Object.values(childSnapshot.val().reviews).length;
                } else {
                    data.ratings = 0;
                }
                const subcategoryRef = ref(db, `subcategories/${data.subcategory}`);
                onValue(subcategoryRef, (snapshot) => {
                    data.subcategoryName = snapshot.val().name;
                });   
                furniture.push(data);
            });
            setFurniture(furniture);
            setFurnitureLength(furniture.length);
        });
    }, []);

    useEffect(() => {
        const userRef = ref(db, `users/${user?.uid}`);
        onValue(userRef, (snapshot) => {
            const user = snapshot.val();
            setCart(user?.cart || {});
        });        
    }, [user]);

    useEffect(() => {
        if (furniture) {
            const topFurniture = furniture
                .filter((furniture) => furniture.order_length > 0)
                .sort((a, b) => b.order_length - a.order_length)
                .slice(0, 10);     
            console.log(topFurniture);
            setTopFurniture(topFurniture);
        }
    }, [furniture]);

    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleVariantClick = (selectedFurniture, variant) => {
        const variantImage = selectedFurniture.variants[variant].image;
        const variantColor = selectedFurniture.variants[variant].color;
        const updatedFurnitureData = furniture.map((item) => {
            if (item.id === selectedFurniture.id) {
                return {
                    ...item,
                    mainImage: variantImage,
                    selectedVariant: variant,
                    selectedColor: variantColor
                };
            }
            return item;
        });
        setFurniture(updatedFurnitureData);
        console.log(updatedFurnitureData);
    };

    const PriceTemplate = (rowData) => {
        let discountedPrice = 0.0;
        const discount = Number(rowData.discount);
        const price = Number(rowData.price);
        if (discount > 0) {
            discountedPrice = price - (price * discount / 100);
        }

        const hasDecimal = (price % 1 !== 0) || (discountedPrice % 1 !== 0);
    
        return (
            <Flex w="full" direction="row" gap={2}>
                {
                    Number(rowData.discount) > 0 ? (
                        <Flex w="full" direction="column">
                            <Flex direction="row" gap={3}>
                                <Flex direction="row" gap={2}>
                                    <Text fontWeight={600} fontSize="md" color={"green"}>RM</Text>
                                    <Text fontWeight={600} fontSize="xl">{discountedPrice.toFixed(hasDecimal ? 2 : 0)}</Text>                
                                </Flex>                            
                                <Text fontWeight={600} fontSize="xl" color={"red"} textDecoration="line-through">{Number(rowData.price).toFixed(hasDecimal ? 2 : 0)}</Text>                                
                            </Flex>                       
                        </Flex>
    
                    ) : (
                        <Flex direction="row" gap={2}>
                            <Text fontWeight={600} fontSize="md" color={"green"}>RM</Text>
                            <Text fontWeight={600} fontSize="xl">{Number(rowData.price).toFixed(hasDecimal ? 2 : 0)}</Text>                
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

    const addFurnitureToCart = async (furnitureId, furnitureName, variantId) => {
        try {
            await addToCart(furnitureId, user?.uid, variantId);
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
        <Flex h="auto" bg="#f4f4f4" direction="column" alignItems="center">
            <Flex w="full" h="30rem" p={6} gap={5}>
                <Flex w="50%">
                    <img 
                        w="full" 
                        h="full" 
                        src="\src\assets\images\Landing_Header_Image_2_nobg_cropped.png" 
                        alt="Landing Header Image" 
                        style={{ width: "100%", objectFit: "contain" }}
                    />
                </Flex>                
                <Flex w="50%" direction="column" mt={4}>
                    <Text fontSize="sm" letterSpacing="wide">TRENDY COLLECTIONS</Text>
                    <Flex w="full" alignItems="center" direction="row" gap={3}>
                        <Text fontSize="5xl" fontWeight="700">Make Your</Text>
                        <Text fontSize="5xl" color="#d69511" fontWeight="700">Interior</Text>
                    </Flex>
                    <Text fontSize="5xl" fontWeight="700">Unique & Modern</Text>
                    <Text mt={2} fontSize="lg" color="gray.500" fontWeight="600">Transform Your Space, One Piece at a Time</Text>
                    <Flex w="full" direction="row" alignItems="center" mt={12} gap={10}>
                        <Button colorScheme="yellow" variant="solid" rightIcon={<GoArrowRight />} _focus={{ outline: "none" }} as="a" onClick={() => smoothScrollTo('trending-products')}>
                            <Text fontSize="lg" fontWeight="600" color="black">Shop Now</Text>
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
            <Flex h="25rem" bg="white">
                <Flex w="60%" h="full" >
                    <img src="src/assets/images/Spacejoy.jpg" alt="Spacejoy Image" style={{ width: "100%", objectFit: "cover" }} />
                </Flex>
                <Flex w="40%" h="full" p={7}>
                    <Flex w="full" direction="column" gap={2}>
                        <Text fontSize="md" fontWeight="600" color="gray.500" letterSpacing="wide">Best Services</Text>
                        <Text fontSize="2xl" fontWeight="700" style={{ backgroundImage: 'linear-gradient(to right, #d69511, #000000)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Elevate Your Experience With Us.</Text>
                        <Flex w="full" direction="row" gap={6} mt={5} alignItems="center">
                            <Box w="65px" h="65px" bg="#d69511" rounded={"lg"} display="flex" alignItems="center" justifyContent="center">
                                <AiOutlineUser size={"45px"} color="#ffe873"/>
                            </Box>
                            <Flex direction="column" >
                                <Text fontSize="md" color="gray.600" fontWeight="600">{numOfCategories} Categories</Text>
                                <Text fontSize="sm" color="gray.500" fontWeight="500">Customize your home layout with ease!</Text>
                            </Flex>
                        </Flex>
                        <Flex w="full" direction="row" gap={6} mt={3} alignItems="center">
                            <Box w="65px" h="65px" bg="#d69511" rounded={"lg"} display="flex" alignItems="center" justifyContent="center">
                                <RiEmotionHappyLine size={"45px"} color="#ffe873"/>
                            </Box>
                            <Flex direction="column" >
                                <Text fontSize="md" color="gray.600" fontWeight="600">78 Happy Clients</Text>
                                <Text fontSize="sm" color="gray.500" fontWeight="500">Quality products. Happy home.</Text>
                            </Flex>
                        </Flex>
                        <Flex w="full" direction="row" gap={6} mt={3} alignItems="center">
                            <Box w="65px" h="65px" bg="#d69511" rounded={"lg"} display="flex" alignItems="center" justifyContent="center">
                                <IoBedOutline size={"45px"} color="#ffe873"/>
                            </Box>
                            <Flex direction="column" >
                                <Text fontSize="md" color="gray.600" fontWeight="600">{furnitureLength} Furnitures</Text>
                                <Text fontSize="sm" color="gray.500" fontWeight="500">A plethora of items to choose!</Text>
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
            <Flex w="85%" my={12} direction="column" >
                <Flex w="full" direction="row" justifyContent="space-between">
                    <Text fontSize="2xl" fontWeight="700" letterSpacing="wide" >Browse by Category</Text>
                    <Box>
                        <InputGroup>
                            <InputLeftElement
                                pointerEvents="none"
                                children={<BiSearchAlt2 color="gray.300" />}
                            />
                            <Input
                                w="full"
                                placeholder="Search"
                                size="md"
                                focusBorderColor="blue.500"
                                borderRadius="lg"
                                borderColor="gray.300"
                                backgroundColor="white"
                                color="gray.800"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </InputGroup>
                    </Box>   
                </Flex>
                
                <Flex 
                    direction="row" 
                    gap={5} 
                    pb={5}
                    overflowX="auto"
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
                    {filteredCategories.map((category, index) => (
                        <NavLink to={`/category/${category.id}`} key={index}>
                            <Box key={index} direction="column" alignItems="center" w={"200px"} h={"200px"} bgColor="#f8f8f8" borderRadius="md" mt={4} transition="transform 0.2s" _hover={{ transform: 'scale(1.05)', shadow: 'md' }}>
                                <img src={category.image} alt={category.name} style={{ width: "100%", height: "70%", objectFit: "contain" }} />
                                <Text mt={1} mx={1} textAlign="center" fontSize="sm" fontWeight="600">{category.name}</Text>
                            </Box>                            
                        </NavLink>
                    ))}
                </Flex>
            </Flex>
            <Flex 
                w="full"
                alignItems="center"
                justifyContent="center"
                py={5}
            >
                <Flex id="trending-products" w="85%" direction="column" mb={4}>
                    <Flex w="full" alignItems="center" justifyContent="center" direction="column">
                        <Text fontSize="2xl" fontWeight="700" letterSpacing="wide">Popular Products</Text>
                        <Text fontSize="md" fontWeight="500" mt={3} color="gray.500">Discover the latest trends in furniture with our curated 
                            collection of stylish and functional pieces that effortlessly elevate any living space.</Text>
                    </Flex>
                    <Flex 
                        direction="row" 
                        gap={5} 
                        py={5}
                        overflowX="auto"
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
                        {
                            topFurniture.map((furniture, index) => (
                                <Box as={NavLink} to={`/furniture/${furniture.id}/details`} key={index} direction="column" alignItems="center" minW="340px" minH="520px" maxW="340px" maxH="520px" transition="transform 0.2s" _hover={{ color: '#d69511'}} p={5} bg={"white"} boxShadow={"md"}>
                                    <img src={furniture?.mainImage} alt={furniture?.name} style={{ width: "100%", height: "200px", objectFit: "contain" }} />
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
                                                { furniture?.reviews ? Object.values(furniture?.reviews).length : 0 } ratings
                                            </Box>
                                        </Box>              
                                        <Flex gap={2} alignItems="center" color='red' onClick={(e) => {e.preventDefault(); toggleLike(furniture?.id);}} transition="transform 0.2s" _hover={{ transform: 'scale(1.2)' }}>
                                            {user?.favourites?.includes(furniture?.id) ? <IoIosHeart size={"25px"}/> : <IoIosHeartEmpty size={"25px"}/>} <Text fontSize="sm">({furniture?.favourites?.length || 0})</Text>
                                        </Flex>
                                    </Flex>
                                    <Flex w="full" direction="row" alignItems="center" justifyContent="space-between" mt={2}>
                                        <Flex direction="row" gap={3} alignItems="center">
                                            <Text fontSize="xl" fontWeight="700">{furniture.name}</Text>
                                            <Text fontSize="sm" fontWeight="500" color="gray.500">{furniture?.selectedColor}</Text>
                                        </Flex>
                                        
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
        
                                    <Flex w="full" direction="row" gap={5} mb={3}>
                                        {
                                            Object.keys(furniture?.variants).map((variant, index) => (
                                                furniture?.variants[variant].inventory > 0 ? (
                                                    <Tooltip key={index} label={furniture?.variants[variant].color} aria-label="Variant color" placement="top">
                                                        <Box
                                                            transition="transform 0.2s"
                                                            _hover={{ transform: 'scale(1.1)' }}
                                                            outline= {furniture?.selectedVariant == variant ? '1px solid blue' : 'none'}
                                                            p={1}
                                                            onClick={(e) => { e.preventDefault(); handleVariantClick(furniture, variant); }}
                                                        >
                                                            <img src={furniture?.variants[variant].image} alt={furniture?.variants[variant].name} style={{ width: "60px", height: "60px", objectFit: "contain" }} />
                                                        </Box>                                                
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip key={index} label={furniture?.variants[variant].color} aria-label="Variant color" placement="top">
                                                        <Box key={index} onClick={(e) => { e.preventDefault(); }} position="relative">
                                                            <Badge colorScheme="red" fontSize="3xs" color="red" position="absolute" bottom="-1" right="-1">Out of Stock</Badge>
                                                            <img src={furniture?.variants[variant].image} alt={furniture?.variants[variant].name} style={{ width: "60px", height: "60px", objectFit: "contain", filter: "grayscale(100%)" }} />
                                                        </Box>
                                                    </Tooltip>
                                                )
                                            ))
                                        }
                                    </Flex>
                                    {
                                        Object.values(cart).find((item) => item.variantId === furniture.selectedVariant) ? (
                                            <Flex w="full" direction="row" justifyContent="center" gap={2}>
                                                <Button w="full" colorScheme="green" variant="solid" size="md" leftIcon={<IoCartOutline />}>Already In Cart</Button>
                                            </Flex>
                                        ) : (
                                            <Flex w="full" direction="row" justifyContent="center" gap={2}>
                                                <Button w="full" colorScheme="blue" variant="solid" size="md" leftIcon={<IoCartOutline />} onClick={(e) => {e.preventDefault(); addFurnitureToCart(furniture.id, furniture.name, furniture.selectedVariant);}}>Add to Cart</Button>
                                            </Flex>
                                        )
                                    }
                                </Box>
                            ))
                        }
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
}

export default CustomerHome;