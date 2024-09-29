import {
	Text,
    Flex,
    Box,
    Button,
    Divider,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    useToast,
    SimpleGrid,
    Badge,
    Tooltip,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { IoCartOutline } from "react-icons/io5";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import { db } from "../../../api/firebase";
import {useAuth} from "../../components/AuthCtx.jsx";
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import { onValue, query, ref, orderByChild, equalTo, get } from "firebase/database";
import { FaStar, FaStarHalf } from "react-icons/fa";
import { BiSearchAlt2 } from "react-icons/bi";
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
    const [searchFurniturePriceQuery, setSearchFurniturePriceQuery] = useState("");
    const [searchFurnitureColorQuery, setSearchFurnitureColorQuery] = useState("");
    const [searchFurnitureMaterialQuery, setSearchFurnitureMaterialQuery] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [filterByFavourites, setFilterByFavourites] = useState(false);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [materialFilters, setMaterialFilters] = useState([]);
    const [colorFilters, setColorFilters] = useState([]);
    const priceRangeFilter = {
        "0-199": { min: 0, max: 199 },
        "200-399": { min: 200, max: 399 },
        "400-599": { min: 400, max: 599 },
        "600-799": { min: 600, max: 799 },
        "800+": { min: 800, max: 999999 }
    }

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
            setCart(user?.cart || {});
        });        
    }, [user]);

    useEffect(() => {
        const furnitureRef = ref(db, 'furniture');
        onValue(furnitureRef, (snapshot) => {
            const furniture = [];
            const materials = [];
            const colors = [];
            snapshot.forEach((furnitureSnapshot) => {
                if (furnitureIds.includes(furnitureSnapshot.key)) {
                    const subcategoryRef = ref(db, `subcategories/${furnitureSnapshot.val().subcategory}`);
                    get(subcategoryRef).then((subcategorySnapshot) => {
                        const subcategory = subcategorySnapshot.val().name;
                        let allVariantsOutOfStock = true;
                        Object.values(furnitureSnapshot.val().variants).forEach((variant) => {
                            if (variant.inventory > 0) {
                                allVariantsOutOfStock = false;
                            }
                        });
                        if (allVariantsOutOfStock) {
                            return;
                        } else {
                            const variants = Object.values(furnitureSnapshot.val().variants);
                            const firstVariantImage = variants.length > 0 ? variants.find((variant) => variant.inventory > 0).image : null;
                            const firstVariantId = variants.length > 0 ? Object.keys(furnitureSnapshot.val().variants).find((variant) => furnitureSnapshot.val().variants[variant].inventory > 0) : null;
                            const firstVariantColor = variants.length > 0 ? variants.find((variant) => variant.inventory > 0).color : null;
                            let ratings = 0;
                            if (furnitureSnapshot.val().reviews) {
                                ratings = Object.values(furnitureSnapshot.val().reviews).reduce((acc, review) => acc + review.rating, 0) / Object.values(furnitureSnapshot.val().reviews).length;
                            } else {
                                ratings = 0;
                            }
                            furniture.push({
                                id: furnitureSnapshot.key,
                                subcategoryName: subcategory,
                                mainImage: firstVariantImage,
                                selectedVariant: firstVariantId,
                                selectedColor: firstVariantColor,
                                ratings: ratings,
                                ...furnitureSnapshot.val()
                            });
                            if (!materials.includes(furnitureSnapshot.val().material)) {
                                materials.push(furnitureSnapshot.val().material);
                            }
                            variants.forEach((variant) => {
                                const trimmedColor = variant.color.trim();
                                if (!colors.includes(trimmedColor)) {
                                    colors.push(trimmedColor);
                                }
                            });                            
                        }

                        setColorFilters(colors);
                        setFurniture(furniture);
                        setMaterialFilters(materials);
                    }).catch((error) => {
                        console.error("Error fetching subcategory name:", error);
                    });
                }
            });
        });
    }, [furnitureIds]);

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

    const sortFurniture = (a, b) => {
        if (sortBy === "price_ascending") {
            return a.price - b.price;
        } else if (sortBy === "price_descending") {
            return b.price - a.price;
        } else if (sortBy === "ratings") {
            return b.ratings - a.ratings;
        } else if (sortBy === "height") {
            return b.height - a.height;
        } else if (sortBy === "length") {
            return b.length - a.length;
        } else if (sortBy === "width") {
            return b.width - a.width;
        } else if (sortBy === "newest") {
            return new Date(b.created_on) - new Date(a.created_on);
        } else if (sortBy === "oldest") {
            return new Date(a.created_on) - new Date(b.created_on);
        }
        return 0;
    };

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
                        <Text ml={2} color="#d69511" fontSize="xl" fontWeight="bold">Filter By Subcategories</Text>
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
                                <Text mt={1} textAlign="center" fontSize="md" fontWeight="600" color={subcategory === selectedSubcategory ? "#d69511" : "black"}>{subcategory?.name}</Text>
                            </Box>    
                        ))}
                    </Flex>                       
                </Flex>
            </Flex>

            <Flex w="full" h="auto" direction="column" gap={5}>
                <Flex w="full" direction="row" gap={5}>
                    <Flex>
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
                    <Flex>
                        <Select
                            placeholder="Filter by Price Range"   
                            size="md"
                            focusBorderColor="blue.500"
                            borderRadius="lg"
                            borderColor="gray.300"
                            backgroundColor="white"
                            color="gray.800"
                            onChange={(e) => { setSearchFurniturePriceQuery(e.target.value); }}
                        >
                            {
                                Object.keys(priceRangeFilter).map((priceRange, index) => (
                                    <option key={index} value={priceRange}>RM {priceRange}</option>
                                ))
                            }
                        </Select>
                    </Flex>      
                    <Flex>
                        <Select
                            placeholder="Filter by Material"   
                            size="md"
                            focusBorderColor="blue.500"
                            borderRadius="lg"
                            borderColor="gray.300"
                            backgroundColor="white"
                            color="gray.800"
                            onChange={(e) => { setSearchFurnitureMaterialQuery(e.target.value); }}
                        >
                            {
                                materialFilters.map((material, index) => (
                                    <option key={index} value={material}>{material}</option>
                                ))
                            }
                        </Select>
                    </Flex>   
                    <Flex>
                        <Select
                            placeholder="Filter by Color"   
                            size="md"
                            focusBorderColor="blue.500"
                            borderRadius="lg"
                            borderColor="gray.300"
                            backgroundColor="white"
                            color="gray.800"
                            onChange={(e) => { setSearchFurnitureColorQuery(e.target.value); }}
                        >
                            {
                                colorFilters.map((color, index) => (
                                    <option key={index} value={color}>{color}</option>
                                ))
                            }
                        </Select>
                    </Flex>     
                    <Flex>
                        <Select
                            placeholder="Sort by"
                            size="md"
                            focusBorderColor="blue.500"
                            borderRadius="lg"
                            borderColor="gray.300"
                            backgroundColor="white"
                            color="gray.800"
                            onChange={(e) => { setSortBy(e.target.value); }}
                        >
                            <option value="price_ascending">Price: Low to High</option>
                            <option value="price_descending">Price: High to Low</option>
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="ratings">Ratings</option>
                            <option value="height">Height</option>
                            <option value="length">Length</option>
                            <option value="width">Width</option>
                        </Select>
                    </Flex>              
                    <Flex>
                        {
                            filterByFavourites ?
                                <Button colorScheme="red" variant="solid" size="md" leftIcon={<IoIosHeart />} onClick={(e) => {e.preventDefault(); setFilterByFavourites(false)}}>Remove Filter</Button>
                              : <Button colorScheme="blue" variant="solid" size="md" leftIcon={<IoIosHeartEmpty />} onClick={(e) => {e.preventDefault(); setFilterByFavourites(true)}}>Filter by Favourites</Button>
                        }
                    </Flex>
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
                        .filter((furniture) =>
                            filterByFavourites ? user?.favourites?.includes(furniture.id) : true
                        )
                        .filter((furniture) => {
                            const price = Number(furniture.price);
                            const priceRange = priceRangeFilter[searchFurniturePriceQuery];
                            return priceRange ? price >= priceRange.min && price <= priceRange.max : true;
                        })
                        .filter((furniture) =>
                            searchFurnitureMaterialQuery === "" ? true : furniture.material === searchFurnitureMaterialQuery
                        )
                        .filter((furniture) =>
                            searchFurnitureColorQuery === "" ? true : Object.values(furniture.variants).some((variant) => variant.color === searchFurnitureColorQuery)
                        )
                        .sort(sortFurniture)
                        .map((furniture, index) => (
                        <Box as={NavLink} to={`/furniture/${furniture.id}/details`} key={index} direction="column" alignItems="center" minW="340px" minH="480px" maxW="340px" maxH="480px" transition="transform 0.2s" _hover={{ color: '#d69511'}}>
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
                    ))}
                </SimpleGrid>
            </Flex>            
        </Flex>
    );
}

export default CustomerCategoryDetails;