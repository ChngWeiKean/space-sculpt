import {
	Text,
    Flex,
    Box,
    Button,
    Image,
    Divider,
    Input,
    InputGroup,
    InputLeftElement,
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
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { IoBedOutline } from "react-icons/io5";
import { GiMoneyStack } from "react-icons/gi";
import { IoIosHeart, IoMdArrowRoundBack } from "react-icons/io";
import { MdOutlineSell, MdOutlineInventory } from "react-icons/md";
import { CiWarning } from "react-icons/ci";
import { GoSmiley } from "react-icons/go";
import { RiArrowGoBackFill } from "react-icons/ri";
import { db } from "../../../api/firebase";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import { onValue, query, ref, orderByChild, equalTo } from "firebase/database";
import { FaStar, FaStarHalf, FaEye, FaTrash } from "react-icons/fa";
import { BiSearchAlt2 } from "react-icons/bi";
import { NavLink, useParams } from 'react-router-dom';
import { deleteFurniture, restoreFurniture } from "../../../api/admin";

function CategoryDetails() {
    const { id } = useParams();
    const [category, setCategory] = useState(null);
    const [subcategories, setSubcategories] = useState([]);
    const [furnitureIds, setFurnitureIds] = useState([]);
    const [furniture, setFurniture] = useState([]);
    const [subcategoryNames, setSubcategoryNames] = useState([]);
    const [numOfFurniture, setNumOfFurniture] = useState(0);
    const [inventory, setInventory] = useState(0);
    const [furnitureSales, setFurnitureSales] = useState(0);
    const [furnitureRevenue, setFurnitureRevenue] = useState(0);
    const [furnitureProfit, setFurnitureProfit] = useState(0);

    useEffect(() => {
        const categoryRef = ref(db, `categories/${id}`);
        onValue(categoryRef, (snapshot) => {
            setCategory(snapshot.val());
        });

        const subcategoryRef = query(ref(db, 'subcategories'), orderByChild('category'), equalTo(id));
        onValue(subcategoryRef, (snapshot) => {
            const subcategories = []
            const subcategoryNames = []
            const furnitureIds = []
            let numOfFurniture = 0;
            snapshot.forEach((subcategorySnapshot) => {
                const subcategoryData = {
                    id: subcategorySnapshot.key,
                    ...subcategorySnapshot.val()
                }
                subcategories.push(subcategoryData);
                subcategorySnapshot.val().furniture?.forEach((furnitureId) => {
                    furnitureIds.push(furnitureId);
                    numOfFurniture++;
                });
                subcategoryNames.push(subcategorySnapshot.val().name)
            });
            setSubcategories(subcategories);
            setSubcategoryNames(subcategoryNames);
            setFurnitureIds(furnitureIds);
            setNumOfFurniture(numOfFurniture);
            console.log(furnitureIds);
        });

    }, [id]);

    useEffect(() => {
        if (!furnitureIds.length || !subcategories.length) return; 
    
        const furnitureRef = ref(db, 'furniture');
        onValue(furnitureRef, (snapshot) => {
            const furniture = [];
            let totalInventory = 0;
            let totalSales = 0;
            let totalRevenue = 0;
            let totalProfit = 0;
            snapshot.forEach((furnitureSnapshot) => {
                const furnitureData = furnitureSnapshot.val();
                if (furnitureData.subcategory && subcategories.some(subcategory => subcategory.id === furnitureData.subcategory)) {
                    const subcategory = subcategories.find(subcategory => subcategory.id === furnitureData.subcategory);
                    const subcategoryName = subcategory.name;
                    const subcategoryImage = subcategory.image;
                    const furnitureItem = {
                        id: furnitureSnapshot.key,
                        type: subcategoryName,
                        subcategoryImage: subcategoryImage,
                        ...furnitureData
                    };
                    if (furnitureData.variants) {
                        Object.keys(furnitureData.variants).forEach(variantId => {
                            const variant = furnitureData.variants[variantId];
                            totalInventory += parseInt(variant.inventory);
                        });
                    }
                    if (furnitureData.orders) {
                        let totalQuantitySold = 0;
                        let profitForEachFurniture = 0;
                        Object.values(furnitureData.orders).forEach(order => {
                            totalQuantitySold += order.quantity;
                            profitForEachFurniture += (order.quantity * (furnitureData.price - (furnitureData.price * furnitureData.discount / 100)) - order.quantity * Number(furnitureData.cost));
                        });
                        furnitureItem.quantity_sold = totalQuantitySold;
                        furnitureItem.profit = profitForEachFurniture;
                        totalSales += totalQuantitySold;
                        totalRevenue += totalQuantitySold * furnitureData.price;
                        // find profit by deducting cost and discounted price and multiply by quantity sold
                        totalProfit += (totalQuantitySold * (furnitureData.price - (furnitureData.price * furnitureData.discount / 100)) - totalQuantitySold * Number(furnitureData.cost));
                    }
                    furniture.push(furnitureItem);
                }
            });
            setFurniture(furniture);
            setInventory(totalInventory);
            setFurnitureSales(totalSales);
            setFurnitureRevenue(totalRevenue);
            setFurnitureProfit(totalProfit);
            console.log(furniture);
        });
    }, [furnitureIds, subcategories]);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        price: { value: null, matchMode: FilterMatchMode.CONTAINS },
        inventory: { value: null, matchMode: FilterMatchMode.CONTAINS },
        quantity_sold: { value: null, matchMode: FilterMatchMode.CONTAINS },
        ratings: { value: null, matchMode: FilterMatchMode.CONTAINS },
        type: { value: null, matchMode: FilterMatchMode.CONTAINS },
        dimension: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    const [selectedFurniture, setSelectedFurniture] = useState(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [rowClick, setRowClick] = useState(true);
    const toast = useToast();
    const [statuses] = useState(['In Stock', 'Out of Stock', 'Under Maintanence']);

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };

        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const renderHeader = () => {
        return (
            <Box>
                <Flex justifyContent='space-between' >
                    <Flex direction="row" alignItems="center" gap={4}>
                        <Text fontSize='2xl' color="#d69511" fontWeight='600'>{category?.name}</Text>
                        <Text fontSize='lg' color="gray.600" fontWeight='500'>Furniture List</Text>
                    </Flex>
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
                                value={globalFilterValue}
                                onChange={onGlobalFilterChange}
                            />
                        </InputGroup>
                    </Box>           
                </Flex>          
                <Divider mt={5} borderColor="blackAlpha.300" borderWidth="1px" />  
            </Box>
        );
    };

    const header = renderHeader();

    const nameBodyTemplate = (rowData) => {
        const variant = rowData?.variants ? Object.values(rowData.variants)[0] : null;
    
        return (
            <Flex w="full" direction="row" alignItems="center" gap={3}>
                <Image
                    boxSize="50px" 
                    src={variant?.image}
                    alt={rowData?.name}
                    objectFit="contain" 
                />
                <Text>{rowData?.name}</Text>
            </Flex>
        );
    };
    
    const typeBodyTemplate = (rowData) => {
        return (
            <Flex w="full" direction="row" alignItems="center" gap={3}>
                <Image
                    boxSize="50px" 
                    src={rowData.subcategoryImage}
                    alt={rowData.type}
                    objectFit="contain" 
                />
                <Text>{rowData.type}</Text>
            </Flex>
        );
    };

    const dimensionBodyTemplate = (rowData) => {
        return (
            <Flex w="full" direction="column">
                <Text>Height: {rowData.height} cm</Text>
                <Text>Width: {rowData.width} cm</Text>
                <Text>Length: {rowData.length} cm</Text>
            </Flex>
        );
    };

    const salesBodyTemplate = (rowData) => {
        return (
            <Flex w="full" direction="row" alignItems="center" gap={4}>
                <Flex w="full" direction="column">
                    <Text>Sold: {rowData?.quantity_sold || 0}</Text>
                    <Text>Revenue: RM {rowData?.quantity_sold * rowData?.price || 0}</Text>
                    <Text>Profit: RM {(rowData?.profit)?.toFixed(2) || 0}</Text>
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

    const inventoryBodyTemplate = (rowData) => {
        return (
            <Flex w="full" direction="column" gap={2}>
                {
                    Object.values(rowData.variants).map((variant, index) => (
                        <Flex key={index} w="full" direction="row" gap={1} alignItems="center">
                            {
                                variant.inventory < 10 ? (
                                    <CiWarning color='red' size='20'/>
                                ) : (
                                    <GoSmiley color='green' size='20'/>
                                )
                            }
                            <Text>{variant.color}:</Text>
                            <Text fontWeight="600">{variant.inventory}</Text>
                        </Flex>
                    ))
                }
            </Flex>
        );
    };

    const ratingBodyTemplate = (rowData) => {
        return (
            <Flex w="full" direction="column" gap={1}>
                <Flex w="full" direction="row" gap={2}>
                    {
                        Array(5)
                            .fill('')
                            .map((_, i) => (
                                i < Math.floor(rowData.ratings) ? (
                                <FaStar key={i} color='#d69511' />
                                ) : (
                                i === Math.floor(rowData.ratings) && rowData.ratings % 1 !== 0 ? (
                                    <FaStarHalf key={i} color='#d69511' />
                                ) : (
                                    <FaStar key={i} color='gray' />
                                )
                                )
                            ))
                    }
                    <Box as='span' ml='2' color='gray.600' fontSize='sm'>
                        {rowData.ratings || 0} ratings
                    </Box>
                </Flex>         
                <Flex w="full" direction="row" gap={2}>
                    <IoIosHeart color='red' size='25'/>
                    <Text color='gray.600' fontSize='sm'>{rowData?.favourites?.length || 0} favourites</Text>
                </Flex>       
            </Flex>

        );
    };

    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();
    const { isOpen: isOpenRevertModal, onOpen: onOpenRevertModal, onClose: onCloseRevertModal } = useDisclosure();
    const [selectedFurnitureForDelete, setSelectedFurnitureForDelete] = useState(null);
    const [selectedFurnitureForRevert, setSelectedFurnitureForRevert] = useState(null);
    
    const handleOpenDeleteModal = (furnitureId) => {
        setSelectedFurnitureForDelete(furnitureId);
        onOpenDeleteModal();
    };
    
    const handleOpenRevertModal = (furnitureId) => {
        setSelectedFurnitureForRevert(furnitureId);
        onOpenRevertModal();
    };
    
    const handleCloseDeleteModal = () => {
        setSelectedFurnitureForDelete(null);
        onCloseDeleteModal();
    };
    
    const handleCloseRevertModal = () => {
        setSelectedFurnitureForRevert(null);
        onCloseRevertModal();
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <Flex justifyContent='center' alignItems='center' gap={2}>
                <Button bg='transparent' as={NavLink} to={`/admin/furniture/${rowData.id}/edit`}><FaEye color='#0078ff'/></Button>
                {
                    !rowData.deleted ? (
                        <Button bg='transparent' _focus={{ boxShadow: 'none', outline: 'none' }} onClick={() => handleOpenDeleteModal(rowData.id)}><FaTrash color='#ff0004'/></Button>
                    ) :
                    (
                        <Button bg='transparent' _focus={{ boxShadow: 'none', outline: 'none' }} onClick={() => handleOpenRevertModal(rowData.id)}><RiArrowGoBackFill color='#ff0004'/></Button>
                    )
                }

                {isOpenDeleteModal && selectedFurnitureForDelete === rowData.id && (
                    <Modal size='xl' isCentered isOpen={isOpenDeleteModal} onClose={handleCloseDeleteModal}>
                        <ModalOverlay
                            bg='blackAlpha.300'
                        />
                        <ModalContent>
                            <ModalHeader>Confirm Delete Furniture</ModalHeader>
                            <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                            <ModalBody>
                                <Text fontSize='md' letterSpacing='wide' fontWeight='bold' mb={2}>
                                    Are you sure you want to delete {rowData.name}?
                                </Text>
                                <Text mb={2}>
                                    Deleting {rowData.name} will permanently remove this furniture from the system.
                                </Text>
                                <Text fontSize='sm' fontWeight='light' letterSpacing='wide'>
                                    This action cannot be undone.
                                </Text>
                            </ModalBody>
                            <ModalFooter>
                                <Box display='flex'>
                                    <Button 
                                        mr={3} 
                                        backgroundColor='red' 
                                        color='white'
                                        onClick={() => {
                                            deleteFurniture(rowData.id).then(r => {
                                                if (r.success) {
                                                    toast({
                                                        title: 'Furniture deleted successfully!',
                                                        status: 'success',
                                                        duration: 5000,
                                                        isClosable: true,
                                                        position: 'top'
                                                    });
                                                } else {
                                                    toast({
                                                        title: 'Error deleting furniture!',
                                                        status: 'error',
                                                        duration: 5000,
                                                        isClosable: true,
                                                        position: 'top'
                                                    });
                                                }
                                            });
                                            console.log('Deleted');
                                            handleCloseDeleteModal();
                                        }}
                                    >
                                        Delete
                                    </Button>
                                    <Button backgroundColor='blue.400' color='white' onClick={handleCloseDeleteModal}>
                                        Close
                                    </Button>
                                </Box>
                            </ModalFooter>
                        </ModalContent>

                    </Modal>                    
                )}

                {isOpenRevertModal && selectedFurnitureForRevert === rowData.id && (
                    <Modal size='xl' isCentered isOpen={isOpenRevertModal} onClose={handleCloseRevertModal}>
                        <ModalOverlay
                            bg='blackAlpha.300'
                        />
                        <ModalContent>
                            <ModalHeader>Confirm Revert Furniture</ModalHeader>
                            <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                            <ModalBody>
                                <Text fontSize='md' letterSpacing='wide' fontWeight='bold' mb={2}>
                                    Are you sure you want to revert {rowData.name}?
                                </Text>
                                <Text mb={2}>
                                    Reverting {rowData.name} will restore this furniture to the system.
                                </Text>
                                <Text fontSize='sm' fontWeight='light' letterSpacing='wide'>
                                    This action cannot be undone.
                                </Text>
                            </ModalBody>
                            <ModalFooter>
                                <Box display='flex'>
                                    <Button
                                        mr={3}
                                        backgroundColor='green'
                                        color='white'
                                        onClick={() => {
                                            restoreFurniture(rowData.id).then(r => {
                                                if (r.success) {
                                                    toast({
                                                        title: 'Furniture restored successfully!',
                                                        status: 'success',
                                                        duration: 5000,
                                                        isClosable: true,
                                                        position: 'top'
                                                    });
                                                } else {
                                                    toast({
                                                        title: 'Error restoring furniture!',
                                                        status: 'error',
                                                        duration: 5000,
                                                        isClosable: true,
                                                        position: 'top'
                                                    });
                                                }
                                            });
                                            console.log('Reverted');
                                            handleCloseRevertModal();
                                        }}
                                    >
                                        Revert
                                    </Button>
                                    <Button backgroundColor='blue.400' color='white' onClick={handleCloseRevertModal}>
                                        Close
                                    </Button>
                                </Box>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                )}
            </Flex>
        );
    };

    const ratingRowFilterTemplate = (options) => {
        return (
            <InputText
                value={options.value || ''}
                onChange={(e) => options.filterApplyCallback(e.target.value, filters['ratings'].matchMode)}
                placeholder="Rating"
                style={{ width: '100%', padding: '0.5rem' }}
            />
        );
    };

    const nameRowFilterTemplate = (options) => {
        return (
            <InputText
                value={options.value || ''}
                onChange={(e) => options.filterApplyCallback(e.target.value, filters['name'].matchMode)}
                placeholder="Name"
                style={{ width: '100%', padding: '0.5rem' }}
            />
        );
    };

    const dimensionRowFilterTemplate = (options) => {
        return (
            <InputText
                value={options.value || ''}
                onChange={(e) => options.filterApplyCallback(e.target.value, filters['dimension'].matchMode)}
                placeholder="Dimension"
                style={{ width: '100%', padding: '0.5rem' }}
            />
        );
    };

    const inventoryRowFilterTemplate = (options) => {
        return (
            <InputText
                value={options.value || ''}
                onChange={(e) => options.filterApplyCallback(e.target.value, filters['inventory'].matchMode)}
                placeholder="Inventory"
                style={{ width: '100%', padding: '0.5rem' }}
            />
        );
    };

    const priceRowFilterTemplate = (options) => {
        return (
            <InputText
                value={options.value || ''}
                onChange={(e) => options.filterApplyCallback(e.target.value, filters['price'].matchMode)}
                placeholder="Price"
                style={{ width: '100%', padding: '0.5rem' }}
            />
        );
    };

    const saleRowFilterTemplate = (options) => {
        return (
            <InputText
                value={options.value || ''}
                onChange={(e) => options.filterApplyCallback(e.target.value, filters['quantity_sold'].matchMode)}
                placeholder="Quantity Sold"
                style={{ width: '100%', padding: '0.5rem' }}
            />
        );
    };

    const typeRowFilterTemplate = (options) => {
        return (
            <Select
                value={options.value || ''}
                onChange={(e) => options.filterApplyCallback(e.target.value)}
                focusBorderColor="blue.500"
                variant={'ghost'}
            >
                {subcategoryNames.map((subcategoryName, index) => (
                    <option key={index} value={subcategoryName}>
                        {subcategoryName}
                    </option>
                ))}
            </Select>
        );
    };

    return (
        <Flex w="full" h="auto" p={4} gap={7} bg="#f4f4f4" direction="column">
            <Flex w="full" h="14rem" direction="row" gap={4}>
                <Flex direction="row" gap={4} alignItems="center">
                    <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                    <Box direction="column" alignItems="center" minW="200px" minH="200px" maxW="200px" maxH="200px">
                        <img src={category?.image} alt={category?.name} style={{ width: "100%", height: "80%", objectFit: "contain" }} />
                        <Text mt={1} textAlign="center" fontSize="md" fontWeight="700" color="#d69511">{category?.name}</Text>
                    </Box>                           
                </Flex>
                <Divider h="full" borderWidth="1px" variant="solid" orientation="vertical" borderColor="gray.500"/>
                <Flex direction="column" w="full">
                    <Text ml={2} color="#d69511" fontSize="xl" fontWeight="bold">Add New Furniture</Text>
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
                        {subcategories?.map((subcategory, index) => (
                            <Box as={NavLink} to={`/admin/subcategory/add-furniture/${subcategory.id}`} key={index} direction="column" alignItems="center" minW="200px" minH="200px" maxW="200px" maxH="200px" transition="transform 0.2s" _hover={{ transform: 'scale(1.05)', color: "blue" }}>
                                <img src={subcategory?.image} alt={subcategory?.name} style={{ width: "100%", height: "80%", objectFit: "contain" }} />
                                <Text mt={1} textAlign="center" fontSize="md" fontWeight="600" >{subcategory?.name}</Text>
                            </Box>    
                        ))}
                    </Flex>                       
                </Flex>
             
            </Flex>
            <Flex w="full" justifyContent="space-between" alignItems="center" direction="row">
                <Flex gap={6}>
                    <Box bg="white" boxShadow="md" p={4}>
                        <Flex justifyContent='center' alignItems='center'>
                            <IoBedOutline color='#d69511' size='35'/>
                            <Box ml={4}>
                                <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>No. Of Furniture</Text>
                                <Text fontSize='md'>{numOfFurniture}</Text>                                
                            </Box>
                        </Flex>
                    </Box>
                    <Box bg="white" boxShadow="md" p={4}>
                        <Flex justifyContent='center' alignItems='center'>
                            <MdOutlineSell color='#d69511' size='35'/>
                            <Box ml={4}>
                                <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Furniture Sales</Text>
                                <Text fontSize='md'>{furnitureSales} sold</Text>                                
                            </Box>
                        </Flex>
                    </Box>
                    <Box bg="white" boxShadow="md" p={4}>
                        <Flex justifyContent='center' alignItems='center'>
                            <MdOutlineInventory color='#d69511' size='35'/>
                            <Box ml={4}>
                                <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Furniture Inventory</Text>
                                <Text fontSize='md'>{inventory} in stock</Text>                                
                            </Box>
                        </Flex>
                    </Box>
                    <Box bg="white" boxShadow="md" p={4}>
                        <Flex justifyContent='center' alignItems='center'>
                            <GiMoneyStack color='#d69511' size='40'/>
                            <Box ml={4}>
                                <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Total Revenue</Text>
                                <Text fontSize='md'>RM {furnitureRevenue}</Text>                                
                            </Box>
                        </Flex>
                    </Box>
                    <Box bg="white" boxShadow="md" p={4}>
                        <Flex justifyContent='center' alignItems='center'>
                            <GiMoneyStack color='#d69511' size='40'/>
                            <Box ml={4}>
                                <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Total Profit</Text>
                                <Text fontSize='md'>RM {furnitureProfit.toFixed(2)}</Text>                                
                            </Box>
                        </Flex>
                    </Box>
                </Flex>
                <Button as={NavLink} to={`/admin/category/${id}/edit`} colorScheme="blue" size="md" variant="solid" borderRadius="xl">Manage Category</Button>
            </Flex>

            <Flex w="full" direction="column">   
                <Box
                    w="full"
                    h="full"
                    bg="white"
                    boxShadow="md"
                    p={3}
                >
                    <DataTable value={furniture} header={header} stripedRows showGridlines paginator rows={10} 
                        removableSort rowsPerPageOptions={[10, 25, 50]} filters={filters} filterDisplay="row" 
                        globalFilterFields={['name', 'price', 'dimension', 'status', 'inventory', 'type']}
                        selectionMode={rowClick ? null : 'checkbox'} selection={selectedFurniture} 
                        onSelectionChange={(e) => setSelectedFurniture(e.value)} dataKey="id"
                    >
                        <Column field="name" header="Name" sortable filter filterElement={nameRowFilterTemplate} body={nameBodyTemplate} ></Column>
                        <Column field="type" header="Type" sortable filter filterElement={typeRowFilterTemplate} body={typeBodyTemplate}></Column>
                        <Column field="dimension" header="Dimension" sortable filter filterElement={dimensionRowFilterTemplate} body={dimensionBodyTemplate}></Column>
                        <Column field="price" header="Price" sortable filter filterElement={priceRowFilterTemplate} body={priceBodyTemplate}></Column>
                        <Column field="quantity_sold" header="Sales" sortable filter filterElement={saleRowFilterTemplate} body={salesBodyTemplate}></Column>
                        <Column field="inventory" header="Inventory" sortable filter filterElement={inventoryRowFilterTemplate} body={inventoryBodyTemplate}></Column>
                        <Column field="ratings" header="Rating/Favourites" sortable filter filterElement={ratingRowFilterTemplate} body={ratingBodyTemplate}></Column>
                        <Column field="action" header="Action" body={actionBodyTemplate}></Column>
                    </DataTable>
                </Box>  
            </Flex>
        </Flex>
    );
}

export default CategoryDetails;