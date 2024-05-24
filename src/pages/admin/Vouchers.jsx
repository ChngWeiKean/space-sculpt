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
import {FaEye, FaHospitalUser, FaStethoscope, FaTrash, FaUser, FaUserShield, FaCar } from 'react-icons/fa';
import { FaTruck } from "react-icons/fa6";
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {FilterMatchMode} from 'primereact/api';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import {NavLink} from 'react-router-dom';

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
        <Center h="auto" bg="#f4f4f4" pt={5}>
            <Flex w="full" direction="column" alignItems="center">
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
                        globalFilterFields={['name', 'role', 'email', 'contact']}
                        dataKey="id"
                    >
                        <Column field="name" header="Name" sortable filter></Column>
                        <Column field="email" header="Email" sortable filter></Column>
                        <Column field="contact" header="Contact" sortable filter></Column>
                        <Column field="role" header="Role" sortable filter></Column>
                        <Column field="action" header="Action"></Column>
                    </DataTable>                    
                </Box>
            </Flex>
        </Center>
    )
}

export default Vouchers;