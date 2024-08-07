import {
	Text,
    Flex,
    Box,
    Button,
    Input,
    InputGroup,
    InputLeftElement,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    TabIndicator,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    Divider,
    Tooltip,
    Badge,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { FaUser, FaStethoscope, FaClinicMedical, FaEye } from "react-icons/fa";
import { IoBedOutline } from "react-icons/io5";
import { GiMoneyStack } from "react-icons/gi";
import { GrTransaction } from "react-icons/gr";
import { IoIosHeart, IoIosHeartEmpty } from "react-icons/io";
import { db } from "../../../api/firebase";
import { onValue, query, ref, get, } from "firebase/database";
import { FaStar, FaStarHalf } from "react-icons/fa";
import { MdOutlineInventory, MdOutlineTexture, MdOutlineAlternateEmail } from "react-icons/md";
import { CiMapPin } from "react-icons/ci";
import { BiSearchAlt2 } from "react-icons/bi";
import { AiOutlineUser } from "react-icons/ai";
import { NavLink } from 'react-router-dom';
import { BarChart } from "../../components/charts/BarChart.jsx";
import { DoughnutChart } from "../../components/charts/DoughnutChart.jsx";
import { Timeline } from 'primereact/timeline';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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
    const [ orders, setOrders ] = useState([]);
    const [ furniture, setFurniture ] = useState([]);
    const [ topFurniture, setTopFurniture ] = useState([]);
    const [ userCount, setUserCount ] = useState(0);
    const [ furnitureCount, setFurnitureCount ] = useState(0);
    const [ orderCount, setOrderCount ] = useState(0);
    const [ searchQuery, setSearchQuery ] = useState('');

    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false
    };

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

        const furnitureRef = ref(db, 'furniture');
        onValue(furnitureRef, (snapshot) => {
            const furniture = [];
            let count = 0;
            snapshot.forEach((childSnapshot) => {
                let order_length = 0;
                const data = {
                    id: childSnapshot.key,
                    ...childSnapshot.val(),
                };
                // get the first variant image as the main image
                const variants = Object.values(data.variants);
                data.mainImage = variants.length > 0 ? variants.find((variant) => variant.inventory > 0).image : null;
                if (data.orders) {
                    order_length = Object.keys(data.orders).length;
                } else {
                    order_length = 0;
                }
                count++;
                data.order_length = order_length;
                furniture.push(data);
            });
            setFurniture(furniture);
            setFurnitureCount(count);
        });

        const fetchOrdersWithUserDetails = async () => {
            const orderRef = ref(db, 'orders');
            onValue(orderRef, async (snapshot) => {
                const orders = [];
                let count = 0;
    
                const fetchUserDetails = async (userId) => {
                    const userRef = ref(db, `users/${userId}`);
                    const userSnapshot = await get(userRef);
                    return userSnapshot.val();
                };
    
                const promises = [];
    
                snapshot.forEach((childSnapshot) => {
                    const data = {
                        ...childSnapshot.val(),
                    };
                    data.ordered_on = new Date(data.created_on);
                    data.created_on = new Date(data.created_on).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }).replace(',', '');
                    count++;
    
                    const orderPromise = fetchUserDetails(data.user_id).then(userData => {
                        data.user = userData;
                        return data;
                    });
    
                    promises.push(orderPromise);
                });
    
                const ordersWithUserDetails = await Promise.all(promises);
                // Sort orders by created_on date (most recent first)
                ordersWithUserDetails.sort((a, b) => new Date(b.ordered_on) - new Date(a.ordered_on));
                console.log(ordersWithUserDetails);
                setOrderCount(count);
                setOrders(ordersWithUserDetails);
            });
        };
    
        fetchOrdersWithUserDetails();
    }, []);

    useEffect(() => {
        if (furniture) {
            const topFurniture = furniture
                .filter((furniture) => furniture.order_length > 0)
                .sort((a, b) => b.order_length - a.order_length)
                .slice(0, 10);     
            
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

    const customizedMarker = (item) => {
        return (
            <Box w="30px" h="30px" rounded="50%" bg="#d69511">
                <AiOutlineUser size={30} color='white'/>
            </Box>
        )
    };

    const customizedContent = (item) => {
        return (
            <Flex 
                as={NavLink}
                to={`/admin/customer-order-details/${item.order_id}`}
                direction="column" 
                gap={2} 
                w="10rem" 
                p={2} 
                boxShadow={"lg"} 
                rounded={"md"} 
                mb={5}
                transition={"transform 0.2s"}
                _hover={{ transform: "scale(1.02)" }}
            > 
                <Flex>
                    <Text fontSize="md" fontWeight="800" color="gray.600" isTruncated>
                        {item.arrival_status}
                    </Text>                    
                </Flex>
                <Flex gap={2}>
                    <Text fontSize="sm" fontWeight="600" color="gray.600" isTruncated>
                        {item.shipping_date} | {item.shipping_time}
                    </Text>
                </Flex>
                <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                <Flex direction="column" gap={1}>
                    <Flex w="full" gap={2}>
                        <AiOutlineUser size={20} color='gray'/>
                        <Text fontSize="sm" fontWeight="600" color="gray.600" isTruncated>
                            {item?.user?.name}
                        </Text>
                    </Flex>
                    <Flex w="full" gap={2}>
                        <MdOutlineAlternateEmail size={20} color='gray'/>
                        <Text fontSize="sm" fontWeight="600" color="gray.600" isTruncated>
                            {item?.user?.email}
                        </Text>
                    </Flex>
                </Flex>                
                <Flex onClick={(e) => e.preventDefault()} mb={5}>
                    <Flex w="100px" direction="column">
                    <Slider {...settings}>
                        {item.items.map((furniture, itemIndex) => (
                        <Flex key={itemIndex}>
                            <img src={furniture.image} alt={furniture.color} style={{ width: "100%", height: "100%", objectFit: "cover", border:"none" }} />
                        </Flex>
                        ))}
                    </Slider>                                                
                    </Flex>                                                    
                </Flex>
            </Flex>
        );
    };

    const customizedOppositeContent = (item) => {
        return (
            <Flex direction="column" gap={2} w="full" mb={5}>
                <Text fontSize="md" fontWeight="700" color="gray.500">Ordered on</Text>
                <Text fontSize="sm" fontWeight="600" color="gray.500">{item.created_on}</Text>
            </Flex>
            
        );
    }

    return (
        <Flex w="full" h="auto" p={4} gap={7} bg="#f4f4f4" direction="column">
            <Flex w="full" gap={7} direction="row">
                <Flex w="70%" direction="column" gap={6}>
                    <Flex w="full" bg='white' boxShadow='md' direction="column" gap={2}>
                        <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' mt={3} mx={3} textAlign='center'>
                            Monthly Revenue (RM)
                        </Text>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
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
                            gap={7} 
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
                                    <Box as={NavLink} to={`/admin/furniture/${furniture.id}/edit`} p={5} boxShadow="md" key={index} direction="column" alignItems="center" minW="340px" minH="480px" maxW="340px" maxH="480px" transition="transform 0.2s" _hover={{ color: '#d69511'}} bg={"white"}>
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
                                                    {furniture?.ratings || 0} ratings
                                                </Box>
                                            </Box>              
                                            <Flex gap={2} alignItems="center" color='red' onClick={(e) => {e.preventDefault(); toggleLike(furniture?.id);}} transition="transform 0.2s" _hover={{ transform: 'scale(1.2)' }}>
                                                <IoIosHeart size={"25px"}/> <Text fontSize="sm">({furniture?.favourites?.length || 0})</Text>
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
                                    </Box>
                                ))
                            }
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
                                        <Text fontWeight='semibold'>{orderCount || 0}</Text>                                
                                    </Box>
                                </Flex>
                            </Box>
                        </Flex>
                        <Flex w="full" direction="column" bg='white' boxShadow='md' gap={2}>
                            <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' mt={3} mx={3} textAlign='center'>
                                Furniture Categories Sold
                            </Text>
                            <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                            <FurnitureCategoryDoughnutChart />                        
                        </Flex>
                    </Flex>

                    <Flex w="full" h="54rem" direction="column" bg='white' boxShadow='md' gap={2}>
                        <Text fontSize='md' fontWeight='semibold' letterSpacing='wide' mt={3} mx={3} textAlign='center'>
                            Order Timeline
                        </Text>
                        <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/> 
                        <Flex 
                            direction="column"
                            overflowX="hidden"
                            overflowY="auto"
                            sx={{ 
                                '&::-webkit-scrollbar': {
                                    width: '7px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: '#092654',
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    backgroundColor: '#f1f1f1',
                                },
                            }}
                            mt={2}
                        >
                            <Timeline value={orders} opposite={customizedOppositeContent} align="alternate" marker={customizedMarker} content={customizedContent} />
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
            
            {/* <Flex w="full" direction="column">
                <Box
                    w="full"
                    h="full"
                    bg="white"
                    boxShadow="md"
                    p={3}
                >

                </Box>  
            </Flex> */}
        </Flex>
    );
}

export default AdminDashboard;