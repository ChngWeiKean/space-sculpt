import {
	Text,
    Flex,
    Box,
    Button,
    Input,
    FormControl,
    FormLabel,
    FormErrorMessage,
    InputLeftAddon,
    InputRightElement,
    InputLeftElement,
    IconButton,
    InputRightAddon,
    Textarea,
    useToast,
    Divider,
    InputGroup,
    Spinner,
    Select,
    Badge,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    HStack,
    Switch,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill, BsPinMap } from "react-icons/bs";
import { RxCross1, RxHeight, RxWidth, RxSize, RxDimensions } from "react-icons/rx";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline, IoCartOutline } from "react-icons/io5";
import { CiWarning } from "react-icons/ci";
import { GoSmiley } from "react-icons/go";
import { GrThreeD } from "react-icons/gr";
import { BiLinkExternal, BiSearchAlt2 } from "react-icons/bi";
import { FaImage, FaRegFileImage } from "react-icons/fa6";
import { AiOutlineDash } from "react-icons/ai";
import { FaPlus, FaTrash, FaStar, FaStarHalf, FaMinus } from "react-icons/fa6";
import { FaRegUser } from "react-icons/fa";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { TbPasswordFingerprint } from "react-icons/tb";
import { MdOutlineInventory, MdOutlineTexture, MdOutlineAlternateEmail, MdDateRange } from "react-icons/md";
import { Form, useForm } from "react-hook-form";
import { NavLink, useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from "../../components/AuthCtx.jsx";
import { db } from "../../../api/firebase";
import { onValue, ref, query, orderByChild, equalTo, set } from "firebase/database";
import { Autocomplete, GoogleMap, InfoWindow, Marker, LoadScript } from "@react-google-maps/api";
import { addAddress } from "../../../api/customer.js";

function CustomerAddAddress() {
    const {
        handleSubmit,
        register,
        formState: {
            errors, isSubmitting
        }
    } = useForm();
    const { user } = useAuth();
    const [ place, setPlace ] = useState(null);
    const [ isDefault, setDefault ] = useState(false);
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

    const onSubmit = async (data) => {
        const addressData = {
            name: place.name,
            formatted_address: place.address,
            place_id: place.place_id,
        }

        try {
            await addAddress(user.uid, addressData);
            toast({
                title: "Address added successfully",
                status: "success",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
            window.history.back()
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
    }

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
