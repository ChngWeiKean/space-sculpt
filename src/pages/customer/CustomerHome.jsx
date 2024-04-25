import {
    Button,
    Flex,
	Text,
    Box,
    Input,
    InputGroup,
    InputLeftElement,
    
} from "@chakra-ui/react";
import {useRef, useState, useEffect, memo, useCallback} from "react";
import { FaStar, FaStarHalf } from "react-icons/fa";
import { GoArrowRight } from "react-icons/go";
import { IoIosHeart, IoIosHeartEmpty } from "react-icons/io";
import { RiEmotionHappyLine } from "react-icons/ri";
import { IoBedOutline } from "react-icons/io5";
import { AiOutlineUser } from "react-icons/ai";
import { BiSearchAlt2 } from "react-icons/bi";
import { NavLink } from 'react-router-dom';
import { db } from "../../../api/firebase";
import { onValue, query, ref } from "firebase/database";

function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
}

function CustomerHome() {
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

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
            setCategories(categories);
        });
    }, []);

    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const trending = [
        { name: "LuxeLounge Chair", imageUrl: "https://source.unsplash.com/random" },
        { name: "Harmony Sofa", imageUrl: "https://source.unsplash.com/random" },
        { name: "Zenith Coffee Table", imageUrl: "https://source.unsplash.com/random" },
        { name: "Tranquil Bed", imageUrl: "https://source.unsplash.com/random" },
        { name: "Executive Desk", imageUrl: "https://source.unsplash.com/random" },
        { name: "Classic Cabinet", imageUrl: "https://source.unsplash.com/random" },
        { name: "Elegance Bookshelf", imageUrl: "https://source.unsplash.com/random" },
        { name: "Serenity Dresser", imageUrl: "https://source.unsplash.com/random" },
        { name: "Aura Dining Table", imageUrl: "https://source.unsplash.com/random" },
        { name: "Nova Ottoman", imageUrl: "https://source.unsplash.com/random" },
        { name: "Blissful Bench", imageUrl: "https://source.unsplash.com/random" },
        { name: "Serene Side Table", imageUrl: "https://source.unsplash.com/random" },
        { name: "Radiance Rocking Chair", imageUrl: "https://source.unsplash.com/random" },
    ]

    const [likedProducts, setLikedProducts] = useState(new Array(trending.length).fill(false));

    const toggleLike = (index) => {
        setLikedProducts(prev => {
            const updatedLikedProducts = [...prev];
            updatedLikedProducts[index] = !updatedLikedProducts[index];
            return updatedLikedProducts;
        });
    };

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
                        <Text fontSize="md" color="gray.400" fontWeight="500">Used by 100,00 people globally.</Text>
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
                                <Text fontSize="md" color="gray.600" fontWeight="600">121 Customizations</Text>
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
                                <Text fontSize="md" color="gray.600" fontWeight="600">67 Furnitures</Text>
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
                            <Box key={index} direction="column" alignItems="center" minW="200px" minH="200px" maxW="200px" maxH="200px" bgColor="#f8f8f8" borderRadius="md" mt={4} transition="transform 0.2s" _hover={{ transform: 'scale(1.05)', shadow: 'md' }}>
                                <img src={category.image} alt={category.name} style={{ width: "100%", height: "80%", objectFit: "contain" }} />
                                <Text mt={1} textAlign="center" fontSize="md" fontWeight="600">{category.name}</Text>
                            </Box>                            
                        </NavLink>
                    ))}
                </Flex>
            </Flex>
            <Flex 
                w="full"
                // bg="url('src/assets/images/Landing_Page_Bg_2.jpg')" 
                // bgPosition="center"
                // bgSize="cover"
                alignItems="center"
                justifyContent="center"
                py={5}
            >
                <Flex id="trending-products" w="85%" direction="column" mb={4}>
                    <Flex w="full" alignItems="center" justifyContent="center" direction="column">
                        <Text fontSize="2xl" fontWeight="700" letterSpacing="wide">Trending Products</Text>
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
                        {trending.map((product, index) => (
                            <Box key={index} direction="column" alignItems="center" minW="340px" minH="480px" maxW="340px" maxH="480px" bgColor="#f8f8f8" mt={4} >
                                <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "70%", objectFit: "cover" }} />
                                <Flex w="full" mt={3} justifyContent="space-between" px={3}>
                                    <Box display='flex' alignItems='center'>
                                        {
                                            Array(5)
                                                .fill('')
                                                .map((_, i) => (
                                                    i < Math.floor(4) ? (
                                                    <FaStar key={i} color='#d69511' />
                                                    ) : (
                                                    i === Math.floor(4) && 4 % 1 !== 0 ? (
                                                        <FaStarHalf key={i} color='#d69511' />
                                                    ) : (
                                                        <FaStar key={i} color='gray' />
                                                    )
                                                    )
                                                ))
                                        }
                                        <Box as='span' ml='2' color='gray.600' fontSize='sm'>
                                            {4} ratings
                                        </Box>
                                    </Box>              
                                    <Box as='span' color='red' fontSize='2xl' onClick={() => toggleLike(index)} transition="transform 0.2s" _hover={{ transform: 'scale(1.2)' }}>
                                        {likedProducts[index] ? <IoIosHeart size={"30px"}/> : <IoIosHeartEmpty size={"30px"}/>}
                                    </Box>
                                </Flex>
                                <Text px={3} mt={2} fontSize="xl" fontWeight="700">{product.name}</Text>
                                <Flex px={3} direction="row" mt={2}>
                                    <Flex direction='row'>
                                        <Text fontSize="sm" fontWeight="700" color="black" mr={1}>RM</Text>
                                        <Text fontSize="xl" fontWeight="700" color="black">299</Text>
                                    </Flex>
                                    
                                    <Text fontSize="md" fontWeight="600" color="gray.500" ml={2} textDecoration="line-through">RM399</Text>
                                </Flex>
                            </Box>
                        ))}
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
}

export default CustomerHome;