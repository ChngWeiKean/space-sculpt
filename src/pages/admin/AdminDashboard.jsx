import {
	Text,
    Flex,
    Box,
    Button,
    Input,
    InputGroup,
    InputLeftElement,

    Avatar,
    Menu,
    MenuButton,
    effect,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { FaUser, FaStethoscope, FaClinicMedical, FaEye } from "react-icons/fa";
import { IoBedOutline } from "react-icons/io5";
import { GiMoneyStack } from "react-icons/gi";
import { GrTransaction } from "react-icons/gr";
import { IoIosHeart, IoIosHeartEmpty } from "react-icons/io";
import { db } from "../../../api/firebase";
import { onValue, query, ref } from "firebase/database";
import { FaStar, FaStarHalf } from "react-icons/fa";
import { BiSearchAlt2 } from "react-icons/bi";
import { AiOutlineUser } from "react-icons/ai";
import { NavLink } from 'react-router-dom';
import { BarChart } from "../../components/charts/BarChart.jsx";
import { DoughnutChart } from "../../components/charts/DoughnutChart.jsx";

const FurnitureCategoryDoughnutChart = memo(() => {
    console.log('FurnitureCategoryDoughnutChart');

    const chartData = {
        labels: ['Sofa', 'Table', 'Chair', 'Bed', 'Cabinet', 'Shelf'],
        datasets: [
            {
                data: [300, 50, 100, 40, 120, 80],
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                ],
                hoverBackgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                ],
            },
        ],
    };

    const chartOptions = {
        cutout: '60%',
    };

    return <DoughnutChart data={chartData} options={chartOptions} />;
});

const MonthlyRevenueBarChart = memo(() => {
    console.log('MonthlyRevenueBarChart');

    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Revenue',
                barPercentage: 0.5,
                barThickness: 24,
                maxBarThickness: 48,
                minBarLength: 2,
                data: [6000, 7263, 10222, 3834, 1202, 485, 9373, 8483, 5844, 5838, 737, 4884],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
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
});

function AdminDashboard() {
    const [ categories, setCategories ] = useState([]);
    const [ userCount, setUserCount ] = useState(0);
    const [ furnitureCount, setFurnitureCount ] = useState(0);
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
            setCategories(categories);
        });

        const userRef = ref(db, 'users');
        onValue(userRef, (snapshot) => {
            let count = 0;
            snapshot.forEach((childSnapshot) => {
                if (childSnapshot.val().role === 'Customer') {
                    count++;
                }
            });
            setUserCount(count);
        });

        const furnitureRef = ref(db, 'furnitures');
        onValue(furnitureRef, (snapshot) => {
            let count = 0;
            snapshot.forEach((childSnapshot) => {
                count++;
            });
            setFurnitureCount(count);
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
    ];

    const [likedProducts, setLikedProducts] = useState(new Array(trending.length).fill(false));

    const toggleLike = (index) => {
        setLikedProducts(prev => {
            const updatedLikedProducts = [...prev];
            updatedLikedProducts[index] = !updatedLikedProducts[index];
            return updatedLikedProducts;
        });
    };

    return (
        <Flex w="full" h="auto" p={4} gap={7} bg="#f4f4f4" direction="column">
            <Flex w="full" gap={7} direction="row">
                <Flex w="70%" direction="column" gap={6}>
                    <Flex w="full" bg='white' boxShadow='md' direction="column">
                        <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' mt={3} mx={3} textAlign='center'>
                            Monthly Revenue (RM)
                        </Text>
                        <MonthlyRevenueBarChart />                        
                    </Flex>
                    <Flex w="full" direction="column">
                        <Flex w="full" direction="row" justifyContent="space-between">
                            <Text fontSize="2xl" fontWeight="700" letterSpacing="wide" color="#d69511">Categories</Text>
                            <Flex direction="row" alignItems="center" gap={7}>
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
                                <Button colorScheme="blue" variant="solid" as={NavLink} to={`/admin/category/add`}>Add New Category</Button>
                            </Flex>
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
                            {filteredCategories?.map((category, index) => (
                                <NavLink to={`/admin/category/${category.id}`} key={index}>
                                    <Box key={index} direction="column" alignItems="center" minW="200px" minH="200px" maxW="200px" maxH="200px" bgColor="#f8f8f8" borderRadius="md" mt={4} transition="transform 0.2s" _hover={{ transform: 'scale(1.05)', shadow: 'md' }}>
                                        <img src={category.image} alt={category.name} style={{ width: "100%", height: "80%", objectFit: "contain" }} />
                                        <Text mt={1} textAlign="center" fontSize="md" fontWeight="600">{category.name}</Text>
                                    </Box>                            
                                </NavLink>
                            ))}
                        </Flex>
                    </Flex>

                    <Flex w="full" direction="column" mb={4}>
                        <Flex w="full" direction="column">
                            <Text fontSize="2xl" fontWeight="700" letterSpacing="wide" color="#d69511">Bestselling Products</Text>
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
                            {trending.map((product, index) => (
                                <Box key={index} direction="column" alignItems="center" minW="340px" minH="480px" maxW="340px" maxH="480px" bgColor="#f8f8f8" borderRadius="md" mt={4} >
                                    <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "70%", objectFit: "contain" }} />
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
                <Flex w="30%" direction="column" gap={6}>
                    <Flex w="full" direction="column" gap={9}>
                        <Flex w="full" direction="row" gap={8}>
                            <Box w='full' h='5rem' bg='white' boxShadow='md'>
                                <Flex w='full' h='full' alignItems='center' justifyContent='center'>
                                    <AiOutlineUser size={45} color='#d69511'/>
                                    <Box ml={3} justifyContent='center'>
                                        <Text fontWeight='medium' fontSize='sm' color='gray.600'>
                                            No. of Customers
                                        </Text>            
                                        <Text fontWeight='semibold'>{userCount || 0}</Text>                                
                                    </Box>
                                </Flex>
                            </Box>
                            <Box w='full' h='full' bg='white' boxShadow='md'>
                                <Flex w='full' h='full' alignItems='center' justifyContent='center'>
                                <IoBedOutline size={45} color="#d69511"/>
                                    <Box ml={3} justifyContent='center'>
                                        <Text fontWeight='medium' fontSize='sm' color='gray.600'>
                                            No. of Furnitures
                                        </Text>            
                                        <Text fontWeight='semibold'>{furnitureCount || 0}</Text>                                
                                    </Box>
                                </Flex>
                            </Box>
                        </Flex>
                        <Flex w="full" direction="row" gap={8}>
                            <Box w='full' h='5rem' bg='white' boxShadow='md'>
                                <Flex w='full' h='full' alignItems='center' justifyContent='center'>
                                    <GiMoneyStack size={45} color='#d69511'/>
                                    <Box ml={3} justifyContent='center'>
                                        <Text fontWeight='medium' fontSize='sm' color='gray.600'>
                                            Total Revenue
                                        </Text>            
                                        <Text fontWeight='semibold'>RM 100000</Text>                                
                                    </Box>
                                </Flex>
                            </Box>
                            <Box w='full' h='full' bg='white' boxShadow='md'>
                                <Flex w='full' h='full' alignItems='center' justifyContent='center'>
                                <GrTransaction size={40} color="#d69511"/>
                                    <Box ml={3} justifyContent='center'>
                                        <Text fontWeight='medium' fontSize='sm' color='gray.600'>
                                            No. of Orders
                                        </Text>            
                                        <Text fontWeight='semibold'>120</Text>                                
                                    </Box>
                                </Flex>
                            </Box>
                        </Flex>
                        <Flex w="full" direction="column" bg='white' boxShadow='md'>
                            <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' mt={3} mx={3} textAlign='center'>
                                Furniture Categories Sold
                            </Text>
                            <FurnitureCategoryDoughnutChart />                        
                        </Flex>
                    </Flex>

                    <Flex w="full" h="50rem" direction="column" bg='white' boxShadow='md'>

                    </Flex>
                </Flex>
            </Flex>
            
            <Flex w="full" direction="column">
                <Box
                    w="full"
                    h="full"
                    bg="white"
                    boxShadow="md"
                    p={3}
                >

                </Box>  
            </Flex>
        </Flex>
    );
}

export default AdminDashboard;