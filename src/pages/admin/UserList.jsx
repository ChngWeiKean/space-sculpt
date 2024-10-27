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
} from '@chakra-ui/react'
import {useEffect, useState} from "react";
import {db} from "../../../api/firebase.js";
import {equalTo, onValue, orderByChild, query, ref} from "firebase/database";
import {BiSearchAlt2} from 'react-icons/bi';
import {FaEye, FaTrash, FaUser, FaUserShield, FaCar } from 'react-icons/fa';
import { FaTruck } from "react-icons/fa6";
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {FilterMatchMode} from 'primereact/api';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import {NavLink} from 'react-router-dom';
import {delete_user} from "../../../api/admin.js";

function UserList() {
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        role: { value: null, matchMode: FilterMatchMode.EQUALS },
        email: { value: null, matchMode: FilterMatchMode.CONTAINS },
        contact: { value: null, matchMode: FilterMatchMode.CONTAINS },
        address: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    const [roles] = useState(['Admin', 'Customer', 'Logistics', 'Delivery']);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [selectedUsers, setSelectedUsers] = useState(null);
    const [rowClick, setRowClick] = useState(true);
    const [adminCount, setAdminCount] = useState(0);
    const [logisticsCount, setLogisticsCount] = useState(0);
    const [deliveryCount, setDeliveryCount] = useState(0);
    const [customerCount, setCustomerCount] = useState(0);
    const [expandedRows, setExpandedRows] = useState(null);
    const toast = useToast();

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };

        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const rowExpansionTemplate = (data) => {
        let addresses = [];
        for (let key in data.addresses) {
            addresses.push(data.addresses[key]);
        }

        return (
            <Box px={8}>
                <Text fontSize='lg' fontWeight='bold' mb={4}>Customer Addresses</Text>
                <DataTable value={addresses}>
                    <Column field="name" header="Name" sortable></Column>
                    <Column field="address" header="Address" sortable></Column>
                </DataTable>                
            </Box>

        )
    };

    const roleBodyTemplate = (rowData) => {
        let icon;
      
        switch (rowData.role.toLowerCase()) {
            case 'customer':
                icon = <FaUser color='#d69511'/>;
                break;
            case 'logistics':
                icon = <FaTruck color='#d69511'/>;
                break;
            case 'admin':
                icon = <FaUserShield color='#d69511'/>;
                break;
            case 'delivery':
                icon = <FaCar color='#d69511'/>;
                break;
            default:
                icon = null;
        }
      
        return (
            <Box display='flex' alignItems='center' gap={3}>
                {icon}
                {rowData.role}
            </Box>
        );
    };

    const contactBodyTemplate = (rowData) => {
        return (
            <Box display='flex' alignItems='center' gap={1}>
                {rowData.contact}
            </Box>
        );
    };

    const nameBodyTemplate = (rowData) => {
        return (
            <Box display='flex' alignItems='center' gap={3}>
                {rowData.image ? (
                    <Avatar src={rowData.image} alt={rowData.name} size='sm'/>
                ) : (
                    <FaUser color='#d69511' size='20'/>
                )}
                {rowData.name}
            </Box>
        );
    };

    const [isOpenApprove, setIsOpenApprove] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
  
    const onOpenApprove = (userId) => {
        setSelectedUserId(userId);
        setIsOpenApprove(true);
    };
  
    const onCloseApprove = () => {
        setSelectedUserId(null);
        setIsOpenApprove(false);
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <Flex alignItems='center' gap={2}>
                <Button bg='transparent' as={NavLink} to={`/admin/users/${rowData.id}/view`}><FaEye color='#0078ff'/></Button>
                {
                    rowData.role !== 'Customer' && (
                        <Button bg='transparent' _focus={{ boxShadow: 'none', outline: 'none' }} onClick={() => onOpenApprove(rowData.id)}><FaTrash color='#ff0004'/></Button>
                    )
                }

                {isOpenApprove && selectedUserId === rowData.id && (
                    <Modal size='xl' isCentered isOpen={isOpenApprove} onClose={onCloseApprove}>
                        <ModalOverlay
                            bg='blackAlpha.300'
                        />
                        <ModalContent>
                            <ModalHeader>Confirm Delete User</ModalHeader>
                            <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                            <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                            <ModalBody>
                                <Text fontSize='md' letterSpacing='wide' fontWeight='bold' mb={2}>
                                    Are you sure you want to delete {rowData.name}?
                                </Text>
                                <Text mb={2}>
                                    Deleting {rowData.name} will permanently remove their account.
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
                                            delete_user(rowData).then(r => {
                                                if (r.success) {
                                                    toast({
                                                        title: 'User deleted successfully!',
                                                        status: 'success',
                                                        duration: 5000,
                                                        isClosable: true,
                                                        position: 'top-right'
                                                    });
                                                } else {
                                                    toast({
                                                        title: 'Error deleting user!',
                                                        status: 'error',
                                                        duration: 5000,
                                                        isClosable: true,
                                                        position: 'top-right'
                                                    });
                                                }
                                            });
                                            onCloseApprove();
                                        }}
                                    >
                                        Delete
                                    </Button>
                                    <Button backgroundColor='blue.400' color='white' onClick={onCloseApprove}>
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

    const roleRowFilterTemplate = (options) => {
        return (
            <Select
                value={options.value || ""}
                onChange={(e) => options.filterApplyCallback(e.target.value)}
                focusBorderColor="blue.500"
                variant={'ghost'}
            >
                {roles.map((role, index) => (
                    <option key={index} value={role}>
                        {role}
                    </option>
                ))}
            </Select>
        );
    };

    const nameRowFilterTemplate = (options) => {
        return (
            <InputText
                value={options.value || ""}
                onChange={(e) => options.filterApplyCallback(e.target.value, filters['name'].matchMode)}
                placeholder="Search by name"
                style={{ width: '100%', padding: '0.5rem' }}
            />
        );
    };

    const addressRowFilterTemplate = (options) => {
        return (
            <InputText
                value={options.value || ""}
                onChange={(e) => options.filterApplyCallback(e.target.value, filters['address'].matchMode)}
                placeholder="Search by address"
                style={{ width: '100%', padding: '0.5rem' }}
            />
        );
    };

    const contactRowFilterTemplate = (options) => {
        return (
            <InputText
                value={options.value || ""}
                onChange={(e) => options.filterApplyCallback(e.target.value, filters['contact'].matchMode)}
                placeholder="Search by contact number"
                style={{ width: '100%', padding: '0.5rem' }}
            />
        );
    };

    const emailRowFilterTemplate = (options) => {
        return (
            <InputText
                value={options.value || ""}
                onChange={(e) => options.filterApplyCallback(e.target.value, filters['email'].matchMode)}
                placeholder="Search by email"
                style={{ width: '100%', padding: '0.5rem' }}
            />
        );
    };

    const renderHeader = () => {
        return (
            <Box>
                <Flex justifyContent='space-between' alignItems='center'>
                    <Box>
                        <Text fontSize='2xl' fontWeight='semibold'>List of Users</Text>
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

    useEffect(() => {
        onValue(query(ref(db, 'users'), orderByChild("deleted"), equalTo(null)), (snapshot) => {
            const users = [];
            let adminCount = 0;
            let logisticsCount = 0;
            let deliveryCount = 0;
            let customerCount = 0;
        
            snapshot.forEach((childSnapshot) => {
                const { name, role, email, contact, addresses, password } = childSnapshot.val();
        
                let formattedRole = role.replace(/([a-z])([A-Z])/g, '$1 $2');
                users.push({
                    id: childSnapshot.key,
                    name: name,
                    role: formattedRole,
                    email: email,
                    contact: contact,
                    password: password,
                    addresses: addresses,
                });

                switch (role) {
                    case 'Admin':
                        adminCount++;
                        break;
                    case 'Logistics':
                        logisticsCount++;
                        break;
                    case 'Customer':
                        customerCount++;
                        break;
                    case 'Delivery':
                        deliveryCount++;
                        break;
                    default:
                        break;
                }

            });
            setUsers(users);
            setAdminCount(adminCount);
            setLogisticsCount(logisticsCount);
            setCustomerCount(customerCount);
            setDeliveryCount(deliveryCount);
        });
    }, []); 

    const allowExpansion = (data) => {
        return data.role === 'Customer';
    };

    const header = renderHeader();

    return (
        <Center h="auto" bg="#f4f4f4">
            <Flex direction='column' w='full' justifyContent='center' alignItems='center'>
                <Flex w='95%' my={5} justifyContent='space-between' alignItems='center'>
                    <Flex gap={7}>
                        <Box bg="white" boxShadow="md" p={4}>
                            <Flex justifyContent='center' alignItems='center'>
                                <FaUserShield color='#d69511' size='30'/>
                                <Box ml={4}>
                                    <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Admin</Text>
                                    <Text fontSize='lg'>{adminCount} users</Text>                                
                                </Box>
                            </Flex>
                        </Box>
                        <Box bg="white" boxShadow="md" p={4}>
                            <Flex justifyContent='center' alignItems='center'>
                                <FaCar color='#d69511' size='30'/>
                                <Box ml={4}>
                                    <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Logistics</Text>
                                    <Text fontSize='lg'>{logisticsCount} users</Text>                                
                                </Box>
                            </Flex>
                        </Box>
                        <Box bg="white" boxShadow="md" p={4}>
                            <Flex justifyContent='center' alignItems='center'>
                                <FaUser color='#d69511' size='30'/>
                                <Box ml={4}>
                                    <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Customer</Text>
                                    <Text fontSize='lg'>{customerCount} users</Text>                                
                                </Box>
                            </Flex>
                        </Box>                      
                        <Box bg="white" boxShadow="md" p={4}>
                            <Flex justifyContent='center' alignItems='center'>
                                <FaTruck color='#d69511' size='30'/>
                                <Box ml={4}>
                                    <Text fontWeight='bold' letterSpacing='wide' fontSize='sm'>Delivery Drivers</Text>
                                    <Text fontSize='lg'>{deliveryCount} users</Text>                                
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
                            to={`/admin/users/add`}
                        >
                            Add New User
                        </Button>
                    </Box>
                </Flex>
                <Box
                    w="95%"
                    h="full"
                    bg="white"
                    boxShadow="md"
                    p={3}
                >
                    <DataTable
                        value={users}
                        header={header}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={rowExpansionTemplate}
                        removableSort
                        rowsPerPageOptions={[10, 25, 50]}
                        paginator
                        rows={10}
                        stripedRows 
                        filters={filters}
                        filterDisplay="row"
                        globalFilterFields={['name', 'role', 'email', 'contact']}
                        selection={selectedUsers}
                        onSelectionChange={(e) => setSelectedUsers(e.value)}
                        dataKey="id"
                    >
                        <Column expander={allowExpansion} style={{ width: '3em' }} />
                        <Column field="name" header="Name" sortable filter filterElement={nameRowFilterTemplate} body={nameBodyTemplate}></Column>
                        <Column field="email" header="Email" sortable filter filterElement={emailRowFilterTemplate}></Column>
                        <Column field="contact" header="Contact" sortable filter filterElement={contactRowFilterTemplate} body={contactBodyTemplate}></Column>
                        <Column field="role" header="Role" sortable filter filterElement={roleRowFilterTemplate} body={roleBodyTemplate}></Column>
                        <Column field="action" header="Action" body={actionBodyTemplate}></Column>
                    </DataTable>
                </Box>  
                              
            </Flex>
        </Center>
    );
}

export default UserList;
