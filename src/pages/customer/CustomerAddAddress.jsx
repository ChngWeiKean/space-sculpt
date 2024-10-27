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
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { BiLinkExternal, BiSearchAlt2 } from "react-icons/bi";
import { useForm } from "react-hook-form";
import { Link } from 'react-router-dom';
import { useAuth } from "../../components/AuthCtx.jsx";
import { Autocomplete, GoogleMap, InfoWindow, Marker, LoadScript } from "@react-google-maps/api";
import { addAddress } from "../../../api/customer.js";

function CustomerAddAddress() {
    const {
        handleSubmit,
    } = useForm();
    const { user } = useAuth();
    const [ place, setPlace ] = useState(null);
    const mapStyle = {
		height: '590px',
		width: '100%',
	};
	const [mapRef, setMapRef] = useState(null);
	const [center, setCenter] = useState({
		lat: 5.4164,
		lng: 100.3327,
	});
	const inputRef = useRef();
	
	const handlePlaceSelect = () => {
		if (inputRef.current && inputRef.current.getPlace) {
			const place = inputRef.current.getPlace();
			const place_id = place.place_id;
			const { geometry, formatted_address, name } = place;
			console.log(place);
			const { location } = geometry;
			mapRef.panTo({ lat: location.lat(), lng: location.lng() });
			setPlace({
				lat: location.lat(),
				lng: location.lng(),
				name: name,
				address: formatted_address,
				place_id: place_id,
			});
		}
	};
	
	const getMapsLink = () => {
		if (place) {
			const { name } = place;
			return `https://www.google.com/maps/search/?api=1&query=${name}`;
		}
	}
	
	useEffect(() => {
		if(navigator.geolocation) {
			console.log("Geolocation is supported by this browser.");
			navigator.geolocation.getCurrentPosition((position) => {
				console.log(position);
				setCenter({
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				});
			});
		}
	}, []);

    const toast = useToast();

    const PENANG_BOUNDS = {
        north: 5.4828, // Northernmost point of Penang Island
        south: 5.2270, // Southernmost point of Penang Island
        west: 100.2047, // Westernmost point of Penang Island
        east: 100.3440, // Easternmost point of Penang Island
    };
    
    const isWithinPenang = (lat, lng) => {
        return (
            lat <= PENANG_BOUNDS.north &&
            lat >= PENANG_BOUNDS.south &&
            lng <= PENANG_BOUNDS.east &&
            lng >= PENANG_BOUNDS.west
        );
    };

    const onSubmit = async (data) => {
        if (!place) {
            toast({
                title: "Error",
                description: "Please select an address.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }
    
        const { lat, lng, name, address, place_id } = place;
    
        // Check if the selected place is within Penang Island
        if (!isWithinPenang(lat, lng)) {
            toast({
                title: "Invalid Address",
                description: "The selected address is not within Penang Island. Please choose an address on the island.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }
    
        const addressData = {
            name,
            formatted_address: address,
            place_id: place_id,
        };
    
        try {
            await addAddress(user.uid, addressData);
            toast({
                title: "Address added successfully",
                status: "success",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
            window.history.back();
        } catch (error) {
            console.error("Error adding address:", error);
            toast({
                title: "Error adding address",
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Flex w="full" py={4} px={8} bg="#f4f4f4" direction="column">
            <form action="/api/add-address" method="post">
                <Flex w="full" direction="column">
                    <Flex w="full" direction="row" gap={4} mb={2} justifyContent="space-between">
                        <Flex gap={4} alignItems="center" >
                            <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                            <Text fontSize="2xl" fontWeight="700" color="#d69511">Add New Address</Text>                      
                        </Flex>
                        <Flex gap={12} alignItems="center">
                            <Button colorScheme="blue" size="md" variant="solid" onClick={handleSubmit(onSubmit)}>Confirm & Submit</Button>                
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
                        {place && (
                            <Marker
                                position={{ lat: place.lat, lng: place.lng }}
                            />
                        )}
                        {place && (
                            <InfoWindow
                                position={{ lat: place.lat + 0.0015, lng: place.lng }}
                            >
                                <Box p={1} maxW="sm">
                                    <Text fontSize="sm" fontWeight="medium">
                                        {place.name}
                                    </Text>
                                    <Text fontSize="xs" fontWeight="medium" color="gray.500" mt={1} mb={2}>
                                        {place.address}
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

export default CustomerAddAddress;
