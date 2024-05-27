import {
    Avatar,
    Box,
    Button,
    Center,
    Divider,
    Flex,
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
    Select,
    Text,
    useToast,
    useDisclosure,
} from '@chakra-ui/react'
import { useEffect, useState } from "react";
import { db } from "../../../api/firebase.js";
import { equalTo, onValue, orderByChild, query, ref } from "firebase/database";
import { BiSearchAlt2 } from 'react-icons/bi';
import { FaEye, FaHospitalUser, FaStethoscope, FaTrash, FaUser, FaUserShield, FaCar } from 'react-icons/fa';
import { BsFillCloudArrowDownFill, BsCart3 } from "react-icons/bs";
import { RiArrowGoBackFill } from "react-icons/ri";
import { LiaShippingFastSolid } from "react-icons/lia";
import { FaTruck } from "react-icons/fa6";
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {FilterMatchMode} from 'primereact/api';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import {NavLink} from 'react-router-dom';
import { deleteVoucher, restoreVoucher } from '../../../api/admin.js';

function Vouchers() {
    const [ vouchers, setVouchers ] = useState([]);
    const [ selectedVoucher, setSelectedVoucher ] = useState(null);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        role: { value: null, matchMode: FilterMatchMode.EQUALS },
        email: { value: null, matchMode: FilterMatchMode.CONTAINS },
        contact: { value: null, matchMode: FilterMatchMode.CONTAINS },
        address: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };

        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const discountBodyTemplate = (rowData) => {
        return (
            <Flex direction="row" gap={2}>
                {
                    rowData.discount_type === 'fixed' && <Text fontSize='md'>RM</Text>
                }
                <Text fontSize='md'>{rowData.discount_value}</Text>
                {
                    rowData.discount_type === 'percentage' && <Text fontSize='md'>%</Text>
                }
            </Flex>
        );
    };

    const eligibilityBodyTemplate = (rowData) => {
        return (
            <Flex>
                {
                    rowData.customer_eligibility === 'all' ? (
                        <Text fontSize='md'>All Customers</Text>
                    ) : (
                        <Text fontSize='md'>New Customers</Text>
                    )
                }
            </Flex>
        );
    };

    const activeDateBodyTemplate = (rowData) => {
        let startDate = new Date(rowData.start_date);
        let expiryDate = new Date(rowData.expiry_date);
        let startDay = startDate.getDate();
        let startMonth = startDate.toLocaleString('default', { month: 'long' });
        let startYear = startDate.getFullYear();
        let expiryDay = expiryDate.getDate();
        let expiryMonth = expiryDate.toLocaleString('default', { month: 'long' });
        let expiryYear = expiryDate.getFullYear();

        return (
            <Flex>
                <Text fontSize='md'>{startDay}/{startMonth}/{startYear} - {expiryDay}/{expiryMonth}/{expiryYear}</Text>
            </Flex>
        );
    };

    const applicationBodyTemplate = (rowData) => {
        return (
            <Flex>
                {
                    rowData.discount_application === 'products' ? (
                        <Flex gap={2} alignItems="center">
                            <BsCart3/>
                            <Text fontSize='md'>Products</Text>
                        </Flex>
                    ) : (
                        <Flex gap={2} alignItems="center">
                            <LiaShippingFastSolid/>
                            <Text fontSize='md'>Shipping</Text>
                        </Flex>
                    )
                }
            </Flex>
        );
    };

    const minimumSpendBodyTemplate = (rowData) => {
        return (
            <Flex>
                <Text fontSize='md'>RM {rowData.minimum_spend}</Text>
            </Flex>
        );
    };

    const autoRedemptionAmountBodyTemplate = (rowData) => {
        return (
            <Flex>
                <Text fontSize='md'>RM {rowData.auto_redemption_amount}</Text>
            </Flex>
        );
    };

    const redemptionBodyTemplate = (rowData) => {
        return (
            <Flex direction="column">
                <Text fontSize='md'>Limit: {rowData?.redemption_limit}</Text>
                <Text fontSize='md'>Redeemed: {rowData?.redemption_count}</Text>
            </Flex>
        );
    }

    const toast = useToast();

    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();
    const { isOpen: isOpenRevertModal, onOpen: onOpenRevertModal, onClose: onCloseRevertModal } = useDisclosure();
    const [ selectedVoucherForDelete, setSelectedVoucherForDelete ] = useState(null);
    const [ selectedVoucherForRevert, setSelectedVoucherForRevert ] = useState(null);
    
    const handleOpenDeleteModal = (voucherId) => {
        setSelectedVoucherForDelete(voucherId);
        onOpenDeleteModal();
    };
    
    const handleOpenRevertModal = (voucherId) => {
        setSelectedVoucherForRevert(voucherId);
        onOpenRevertModal();
    };
    
    const handleCloseDeleteModal = () => {
        setSelectedVoucherForDelete(null);
        onCloseDeleteModal();
    };
    
    const handleCloseRevertModal = () => {
        setSelectedVoucherForRevert(null);
        onCloseRevertModal();
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <Flex justifyContent='center' alignItems='center' gap={2}>
                <Button bg='transparent' as={NavLink} to={`/admin/vouchers/${rowData.id}/edit`}><FaEye color='#0078ff'/></Button>
                {
                    !rowData.deleted ? (
                        <Button bg='transparent' _focus={{ boxShadow: 'none', outline: 'none' }} onClick={() => handleOpenDeleteModal(rowData.id)}><FaTrash color='#ff0004'/></Button>
                    ) :
                    (
                        <Button bg='transparent' _focus={{ boxShadow: 'none', outline: 'none' }} onClick={() => handleOpenRevertModal(rowData.id)}><RiArrowGoBackFill color='#ff0004'/></Button>
                    )
                }

                {isOpenDeleteModal && selectedVoucherForDelete === rowData.id && (
                    <Modal size='xl' isCentered isOpen={isOpenDeleteModal} onClose={handleCloseDeleteModal}>
                        <ModalOverlay
                            bg='blackAlpha.300'
                        />
                        <ModalContent>
                            <ModalHeader>Confirm Delete Voucher</ModalHeader>
                            <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                            <ModalBody>
                                <Text fontSize='md' letterSpacing='wide' fontWeight='bold' mb={2}>
                                    Are you sure you want to delete voucher ({rowData.voucher_code})?
                                </Text>
                                <Text mb={2}>
                                    Deleting {rowData.voucher_code} will remove this voucher from the system.
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
                                            deleteVoucher(rowData.id).then(r => {
                                                if (r.success) {
                                                    toast({
                                                        title: 'Voucher deleted successfully!',
                                                        status: 'success',
                                                        duration: 5000,
                                                        isClosable: true,
                                                        position: 'top'
                                                    });
                                                } else {
                                                    toast({
                                                        title: 'Error deleting voucher!',
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

                {isOpenRevertModal && selectedVoucherForRevert === rowData.id && (
                    <Modal size='xl' isCentered isOpen={isOpenRevertModal} onClose={handleCloseRevertModal}>
                        <ModalOverlay
                            bg='blackAlpha.300'
                        />
                        <ModalContent>
                            <ModalHeader>Confirm Revert Voucher</ModalHeader>
                            <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                            <ModalBody>
                                <Text fontSize='md' letterSpacing='wide' fontWeight='bold' mb={2}>
                                    Are you sure you want to revert voucher ({rowData.voucher_code})?
                                </Text>
                                <Text mb={2}>
                                    Reverting {rowData.voucher_code} will restore this voucher to the system.
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
                                            restoreVoucher(rowData.id).then(r => {
                                                if (r.success) {
                                                    toast({
                                                        title: 'Voucher restored successfully!',
                                                        status: 'success',
                                                        duration: 5000,
                                                        isClosable: true,
                                                        position: 'top'
                                                    });
                                                } else {
                                                    toast({
                                                        title: 'Error restoring voucher!',
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

    const renderHeader = () => {
        return (
            <Box>
                <Flex justifyContent='space-between' alignItems='center'>
                    <Box>
                        <Text fontSize='2xl' fontWeight='semibold'>List of Vouchers</Text>
                    </Box>
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

    useEffect(() => {
        const vouchersRef = ref(db, 'vouchers');
        const q = query(vouchersRef, orderByChild('date'));
        onValue(q, (snapshot) => {
            const vouchers = [];
            snapshot.forEach((childSnapshot) => {
                vouchers.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            setVouchers(vouchers);
        });
    }, []);

    return (
        <Flex h="auto" bg="#f4f4f4" pt={5}>
            <Flex w="full" direction="column" alignItems="center">
                <Flex w='95%' mb={5} justifyContent='space-between' alignItems='center'>
                    <Flex gap={7}>
                        <Box bg="white" boxShadow="md" p={4}>
                            <Flex justifyContent='center' alignItems='center'>
                                <FaUserShield color='#d69511' size='30'/>
                                <Box ml={4}>
                                    <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>No. of Redemptions</Text>
                                    <Text fontSize='lg'> </Text>                                
                                </Box>
                            </Flex>
                        </Box>
                        <Box bg="white" boxShadow="md" p={4}>
                            <Flex justifyContent='center' alignItems='center'>
                                <FaCar color='#d69511' size='30'/>
                                <Box ml={4}>
                                    <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>No. of Vouchers Claimed</Text>
                                    <Text fontSize='lg'> </Text>                                
                                </Box>
                            </Flex>
                        </Box>
                    </Flex>
                    <Box>
                        <Button
                            bg="blue.500"
                            color="white"
                            _hover={{ bg: 'blue.600' }}
                            _active={{ bg: 'blue.600' }}
                            _focus={{ boxShadow: 'none' }}
                            as={NavLink}
                            to={`/admin/vouchers/add`}
                        >
                            Add New Voucher
                        </Button>
                    </Box>
                </Flex>
                <Box w="95%" h="full" bg="white" boxShadow="md" p={3}>
                    <DataTable
                        value={vouchers}
                        header={header}
                        removableSort
                        rowsPerPageOptions={[10, 25, 50]}
                        paginator
                        rows={10}
                        stripedRows 
                        filters={filters}
                        filterDisplay="row"
                        globalFilterFields={['voucher_code', 'role', 'email', 'contact']}
                        dataKey="id"
                    >
                        <Column field="voucher_code" header="Voucher Code" sortable filter></Column>
                        <Column field="discount" header="Discount" body={discountBodyTemplate} sortable filter></Column>
                        <Column field="discount_application" header="Application" body={applicationBodyTemplate} sortable filter></Column>
                        <Column field="date" header="Active Date" body={activeDateBodyTemplate} sortable filter></Column>
                        <Column field="minimum_spend" header="Minimum Spend" body={minimumSpendBodyTemplate} sortable filter></Column>
                        <Column field="auto_redemption_amount" header="Redemption Amount" body={autoRedemptionAmountBodyTemplate} sortable filter></Column>
                        <Column field="redemption_limit" header="Redemption" body={redemptionBodyTemplate} sortable filter></Column>
                        <Column field="customer_eligibility" header="Eligibility" body={eligibilityBodyTemplate} sortable filter></Column>
                        <Column field="action" header="Action" body={actionBodyTemplate}></Column>
                    </DataTable>                    
                </Box>
            </Flex>
        </Flex>
    )
}

export default Vouchers;