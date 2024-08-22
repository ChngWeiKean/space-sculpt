import {
	Text,
    Flex,
    Box,
    Button,
    Input,
    InputLeftElement,
    useToast,
    InputGroup,
    HStack,
    useDisclosure,
    Switch,
    Divider,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { BiLinkExternal, BiSearchAlt2 } from "react-icons/bi";
import { FaTrash } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { useParams, Link } from 'react-router-dom';
import { useAuth } from "../../components/AuthCtx.jsx";
import { db } from "../../../api/firebase";
import { ref, query, get } from "firebase/database";
import { Autocomplete, GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { deleteAddress, updateAddress, updateDefaultAddress } from "../../../api/customer.js";

function CustomerEditAddress() {
    const {
        handleSubmit,
    } = useForm();
    const { id } = useParams();
    const { user } = useAuth();
    const [ address, setAddress ] = useState(null);
    const mapStyle = {
		height: '590px',
		width: '100%',
	};
	const libs = ["places"];
	const [mapRef, setMapRef] = useState(null);
	const [center, setCenter] = useState({
		lat: 5.4164,
		lng: 100.3327,
	});
	const inputRef = useRef();
    const { isOpen, onOpen, onClose } = useDisclosure();
	
	const handlePlaceSelect = () => {
		if (inputRef.current && inputRef.current.getPlace) {
			const place = inputRef.current.getPlace();
			const place_id = place.place_id;
			const { geometry, formatted_address, name } = place;
			const { location } = geometry;
			mapRef.panTo({ lat: location.lat(), lng: location.lng() });
            let addressResult = {
                name: name,
                address: formatted_address,
                place_id: place_id,
                isDefault: address.isDefault,
                lat: location.lat(),
                lng: location.lng(),
            }
            setAddress(addressResult);
            console.log("New Address", addressResult);
		}
	};
	
	const getMapsLink = () => {
		if (address) {
			const { name } = address;
			return `https://www.google.com/maps/search/?api=1&query=${name}`;
		}
	}

    const toast = useToast();

    useEffect(() => {
        const fetchPlaceDetails = (address) => {
            const service = new window.google.maps.places.PlacesService(mapRef);
            console.log("Fetching place details for", address.place_id);
            console.log("Service", service);
            service.getDetails(
                {
                    placeId: address.place_id,
                },
                (result, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                        console.log("Place details", result);
                        let addressResult = {
                            name: result.name,
                            address: result.formatted_address,
                            place_id: result.place_id,
                            isDefault: address.isDefault,
                            lat: result.geometry.location.lat(),
                            lng: result.geometry.location.lng(),
                        }
                        mapRef.panTo({ lat: result.geometry.location.lat(), lng: result.geometry.location.lng() });
                        setAddress(addressResult);
                        console.log ("Address", addressResult);
                    } else {
                        console.error(`Error retrieving place details: Status - ${status}`);
                    }
                }
            );
        };
    
        const getAddressDetails = async () => {
            const snapshot = await get(query(ref(db, `users/${user.uid}/addresses/${id}`)));
            const addressData = snapshot.val();
    
            if (addressData && addressData.place_id && window.google && window.google.maps) {
                fetchPlaceDetails(addressData);
            }
        };
    
        getAddressDetails();
    }, [user, id, mapRef]);

    const handleUpdateAddress = async () => {
        try {
            await updateDefaultAddress(user.uid, id);
            toast({
                title: "Address set as default",
                status: "success",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Error updating address:", error);
            toast({
                title: "Error updating address",
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
        }
    }

    const handleDeleteAddress = async () => {
        try {
            await deleteAddress(user.uid, id);
            toast({
                title: "Address deleted successfully",
                status: "success",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
            window.history.back();
        } catch (error) {
            console.error("Error deleting address:", error);
            toast({
                title: "Error deleting address",
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
        }
    }

    const onSubmit = async (data) => {
        const addressData = {
            name: address.name,
            formatted_address: address.address,
            place_id: address.place_id,
            isDefault: address.isDefault,
        }

        try {
            await updateAddress(user.uid, id, addressData);
            toast({
                title: "Address updated successfully",
                status: "success",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
            window.history.back();
        } catch (error) {
            console.error("Error updating address:", error);
            toast({
                title: "Error updating address",
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
        }
    }

    return (
        <Flex w="full" py={4} px={8} bg="#f4f4f4" direction="column">
            <form action="/api/add-address" method="post">
                <Flex w="full" direction="column">
                    <Flex w="full" direction="row" gap={4} mb={2} justifyContent="space-between">
                        <Flex gap={4} alignItems="center" >
                            <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                            <Text fontSize="2xl" fontWeight="700" color="#d69511">Edit Address</Text>                      
                        </Flex>
                        <Flex gap={5} alignItems="center">
                            <Flex gap={3}>
                                <Text fontSize="sm" fontWeight="500" color="gray.500">Set as default address?</Text>
                                <Switch 
                                    size="md" 
                                    colorScheme="yellow"
                                    isChecked={address && address.isDefault}
                                    isDisabled={address && address.isDefault}
                                    onChange={(e) => {handleUpdateAddress()}}
                                />
                            </Flex>
                            <Button colorScheme="blue" size="md" variant="solid" onClick={handleSubmit(onSubmit)}>Confirm & Submit</Button>      
                            <Button colorScheme="red" size="md" variant="solid" onClick={onOpen} gap={3}>
                                <FaTrash /> Delete Address
                            </Button>          

                            <Modal size='xl' isOpen={isOpen} onClose={onClose}>
                                <ModalOverlay
                                    bg='blackAlpha.300'
                                />
                                <ModalContent>
                                    <ModalHeader>
                                        <Text fontSize="lg" fontWeight="700" color="gray.600" letterSpacing="wide">Confirmation to Delete {address && address.name}</Text>
                                    </ModalHeader>
                                    <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                                    <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                                    <ModalBody>
                                        <Text fontSize="md" fontWeight="500" color="gray.600" letterSpacing="wide">
                                            Are you sure you want to delete this address? This action cannot be undone.
                                        </Text>
                                    </ModalBody>
                                    <ModalFooter>
                                        <Button colorScheme="red" mr={3} onClick={handleDeleteAddress}>
                                            Delete
                                        </Button>
                                        <Button colorScheme="blue" mr={3} onClick={onClose}>
                                            Close
                                        </Button>
                                    </ModalFooter>
                                </ModalContent>
                            </Modal>      
                        </Flex>
                    </Flex> 
                    <Box
                        mt={2}
                        w="full"
                    >
                        <Autocomplete
                            onLoad={(autocomplete) => {
                                inputRef.current = autocomplete;
                                autocomplete.setFields(["geometry", "formatted_address", "place_id", "name"]);
                            }}
                            onPlaceChanged={handlePlaceSelect}
                        >
                            <InputGroup size="md">
                                <InputLeftElement
                                    pointerEvents="none"
                                    children={<BiSearchAlt2 color="gray.500" />}
                                />
                                <Input
                                    variant="filled"
                                    bg="white"
                                    type='text'
                                    placeholder="Search for home location..."
                                    ref={inputRef}
                                    focusBorderColor='blue.500'
                                />
                            </InputGroup>
                        </Autocomplete>
                    </Box>
                    <GoogleMap
                        onLoad={(map) => {
                            setMapRef(map);
                        }}
                        center={center}
                        zoom={15} 
                        mapContainerStyle={mapStyle}
                    >
                        {address && (
                            <Marker
                                position={{ lat: address.lat, lng: address.lng }}
                            />
                        )}
                        {address && (
                            <InfoWindow
                                position={{ lat: address.lat + 0.0015, lng: address.lng }}
                            >
                                <Box p={1} maxW="sm">
                                    <Text fontSize="sm" fontWeight="medium">
                                        {address.name}
                                    </Text>
                                    <Text fontSize="xs" fontWeight="medium" color="gray.500" mt={1} mb={2}>
                                        {address.address}
                                    </Text>
                                    <Link
                                        to={getMapsLink()}
                                        target="_blank"
                                        rel="noreferrer"
                                        _hover={{ textDecoration: "none" }}
                                        textDecoration="none"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <HStack spacing={1} fontSize="xs" fontWeight="medium" color="blue.500">
                                            <Text outline="none">View on Google Maps</Text>
                                            <BiLinkExternal />
                                        </HStack>
                                    </Link>
                                </Box>
                            </InfoWindow>
                        )}
                    </GoogleMap>                            
                </Flex>
            </form>
        </Flex>
    )
}

export default CustomerEditAddress;