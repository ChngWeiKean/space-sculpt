import {
	Text,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    TabIndicator,
    Box,
    Flex,
    InputGroup,
    InputLeftElement,
    Input,
    HStack,
    Button,
    Avatar,
    FormControl,
    FormLabel,
    InputRightElement,
    FormHelperText,
    Select,
    useToast,
} from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import { BiSearchAlt2, BiLinkExternal } from "react-icons/bi";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import { MdDateRange } from "react-icons/md";
import { FaShippingFast, FaCalendar } from "react-icons/fa";
import { TbWeight } from "react-icons/tb";
import { FaPlus } from "react-icons/fa6";
import { CiWarning } from "react-icons/ci";
import { FcElectricalThreshold } from "react-icons/fc";
import { GoDash } from "react-icons/go";
import { BsCash } from "react-icons/bs";
import { AiOutlineDeliveredProcedure } from "react-icons/ai";
import { GiPathDistance, GiWeight } from "react-icons/gi";
import { Form, useForm } from "react-hook-form";
import { NavLink, useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from "../../components/AuthCtx.jsx";
import { db } from "../../../api/firebase";
import { onValue, ref, query, orderByChild, equalTo, set, get } from "firebase/database";
import { Autocomplete, GoogleMap, InfoWindow, Marker, LoadScript } from "@react-google-maps/api";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import { updateSettings, updateShopAddress } from "../../../api/logistics.js";

function LogisticsSettings() {
    const {
        handleSubmit,
        register,
        setValue,
        formState: {
            errors, isSubmitting
        }
    } = useForm();
    const [ address, setAddress ] = useState(null);
    const [ settings, setSettings ] = useState(null);
    const mapStyle = {
		height: '575px',
		width: '100%',
	};
	const libs = ["places"];
	const [ mapRef, setMapRef ] = useState(null);
	const [ center, setCenter ] = useState({
		lat: 5.4164,
		lng: 100.3327,
	});
	const inputRef = useRef();

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

    useEffect(() => {
        const settingsRef = ref(db, `settings`);
        onValue(settingsRef, (snapshot) => {
            const data = snapshot.val();
            setSettings(data);
        });
    }, []);

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
            const addressRef = ref(db, `settings/address`);
            onValue(addressRef, (snapshot) => {
                const data = snapshot.val();
                console.log("Address", data);
                if (data) {
                    fetchPlaceDetails(data);
                }
            });
        };
    
        getAddressDetails();
    }, [settings, mapRef]);

    useEffect(() => {
        if (settings) {
            setValue("standard_shipping_fee", settings?.standard_shipping_fee || 0);
            setValue("delivery_offset", settings?.delivery_offset || 0);
            setValue("shipping_fee_threshold", settings?.shipping_fee_threshold || 0);
            setValue("distance_threshold_for_standard_delivery_fee", settings?.distance_threshold_for_standard_delivery_fee || 0);
            setValue("extra_delivery_charges_per_kilometer", settings?.extra_delivery_charges_per_kilometer || 0);
            setValue("initial_delivery_time", settings?.initial_delivery_time || "");
            setValue("end_delivery_time", settings?.end_delivery_time || "");
            setValue("special_handling_charges", settings?.special_handling_charges || 0);
            setValue("maximum_weight_load", settings?.maximum_weight_load || 0);
            setValue("extra_weight_fee_per_kilogram", settings?.extra_weight_fee_per_kilogram || 0);
            setValue("cash_on_delivery_threshold", settings?.cash_on_delivery_threshold || 0);
            setValue("e_wallet_threshold", settings?.e_wallet_threshold || 0);
        }
    }, [settings]);

    const toast = useToast();

    const onSubmit = (type) => async (data) => {
        if (type === "address") {
            console.log("Address", address);
            if (address) {
                let addressData = {
                    name: address.name,
                    address: address.address,
                    place_id: address.place_id,
                    lat: address.lat,
                    lng: address.lng,
                }
                await updateShopAddress(addressData);
                toast({
                    title: "Success",
                    description: "Shop address updated successfully",
                    position: "top",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: "Error",
                    description: "Please select a valid address",
                    position: "top",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        } else if (type === "shipping_settings") {
            let shippingSettings = {
                standard_shipping_fee: data.standard_shipping_fee,
                delivery_offset: data.delivery_offset,
                shipping_fee_threshold: data.shipping_fee_threshold,
                distance_threshold_for_standard_delivery_fee: data.distance_threshold_for_standard_delivery_fee,
                extra_delivery_charges_per_kilometer: data.extra_delivery_charges_per_kilometer,
                initial_delivery_time: data.initial_delivery_time,
                end_delivery_time: data.end_delivery_time,
                special_handling_charges: data.special_handling_charges,
                maximum_weight_load: data.maximum_weight_load,
                extra_weight_fee_per_kilogram: data.extra_weight_fee_per_kilogram,
                cash_on_delivery_threshold: data.cash_on_delivery_threshold,
                e_wallet_threshold: data.e_wallet_threshold,
            }

            if (shippingSettings.shipping_fee < 0 || shippingSettings.delivery_offset < 0 || 
                shippingSettings.shipping_fee_threshold < 0 || shippingSettings.distance_threshold_for_standard_delivery_fee < 0 || 
                shippingSettings.extra_delivery_charges_per_kilometer < 0 || shippingSettings.special_handling_charges < 0 || 
                shippingSettings.maximum_weight_load < 0 || shippingSettings.extra_weight_fee < 0 ||
                shippingSettings.cash_on_delivery_threshold < 0 || shippingSettings.e_wallet_threshold < 0) {
                toast({
                    title: "Error",
                    description: "Please enter positive values for all fields",
                    position: "top",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            if (shippingSettings.e_wallet_threshold < shippingSettings.cash_on_delivery_threshold) {
                toast({
                    title: "Error",
                    description: "Touch 'n Go E-Wallet threshold must be greater than Cash On Delivery threshold",
                    position: "top",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            if (shippingSettings.initial_delivery_time && shippingSettings.end_delivery_time) {
                let initialTime = parseInt(shippingSettings.initial_delivery_time.split(":")[0]);
                if (shippingSettings.initial_delivery_time.includes("pm") && initialTime !== 12) {
                    initialTime += 12;
                }

                let endTime = parseInt(shippingSettings.end_delivery_time.split(":")[0]);
                if (shippingSettings.end_delivery_time.includes("pm") && endTime !== 12) {
                    endTime += 12;
                }
            
                if (initialTime >= endTime) {
                    toast({
                        title: "Error",
                        description: "Initial delivery time must be before end delivery time",
                        position: "top",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                    return;
                }
            }

            await updateSettings(shippingSettings);
            toast({
                title: "Success",
                description: "Shipping settings updated successfully",
                position: "top",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        }
    }

    return (
        <Flex w="full" bg="#f4f4f4" direction="column" alignItems="center" pt={3}>
            <Flex w="full">
                <Tabs w="full" size="md" variant="unstyled">
                    <TabList>
                        <Tab style={{ outline: "none" }}>Shop Address</Tab>
                        <Tab style={{ outline: "none" }}>Shipping & Order Settings</Tab>
                    </TabList>
                    <TabIndicator mt='-1.5px' height='2px' bg='blue.500' borderRadius='1px' />
                    <TabPanels>
                        <TabPanel>
                            <Flex w="full" direction="column" gap={4}>
                                <Flex w="full" gap={5}>
                                    <Box w="full">
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
                                    <Button colorScheme="blue" size="md" variant="solid" onClick={handleSubmit(onSubmit("address"))}>Confirm & Submit</Button>     
                                </Flex>
                                <GoogleMap
                                    onLoad={(map) => { setMapRef(map) }}
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
                                                    style={{ outline: "none" }}
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
                        </TabPanel>
                        <TabPanel>
                            <Flex w="full" direction="column" gap={4} p={4}>
                                <Flex w="full" direction="row" gap={5}>
                                    <FormControl id="standard_shipping_fee">
                                        <FormLabel>
                                            <Flex w="full" gap={2} alignItems="center">
                                                <FaShippingFast color="#d69511" />
                                                <Text fontWeight="600" color="gray.600">Standard Shipping Fee</Text>
                                            </Flex>      
                                        </FormLabel>
                                        <InputGroup size="md">
                                            <InputLeftElement pointerEvents="none">RM</InputLeftElement>
                                            <Input
                                                variant="filled"
                                                id="standard_shipping_fee"
                                                bg="white"
                                                defaultValue={settings?.standard_shipping_fee || 0}
                                                {
                                                    ...register("standard_shipping_fee")
                                                }
                                                type='number'
                                                placeholder="Standard Shipping Fee"
                                                focusBorderColor='blue.500'
                                            />
                                        </InputGroup>
                                        <FormHelperText>
                                            <Text color="blue.500">Standard shipping fee for all orders</Text>
                                        </FormHelperText>
                                    </FormControl>       
                                    <FormControl id="delivery_offset">
                                        <FormLabel>
                                            <Flex w="full" gap={2} alignItems="center">
                                                <MdDateRange color="#d69511" />
                                                <Text fontWeight="600" color="gray.600">Estimated Delivery Offset</Text>
                                            </Flex>      
                                        </FormLabel>
                                        <InputGroup size="md">
                                            <Input
                                                variant="filled"
                                                id="delivery_offset"
                                                bg="white"
                                                defaultValue={settings?.delivery_offset || 0}
                                                {
                                                    ...register("delivery_offset")
                                                }
                                                type='number'
                                                placeholder="Delivery Offset"
                                                focusBorderColor='blue.500'
                                            />
                                            <InputRightElement children="days" />
                                        </InputGroup>
                                        <FormHelperText>
                                            <Text color="blue.500">Estimated delivery offset for all orders</Text>
                                        </FormHelperText>
                                    </FormControl>  
                                    <FormControl id="shipping_threshold">
                                        <FormLabel>
                                            <Flex w="full" gap={2} alignItems="center">
                                                <AiOutlineDeliveredProcedure color="#d69511" />
                                                <Text fontWeight="600" color="gray.600">Order Amount For Free Shipping</Text>
                                            </Flex>      
                                        </FormLabel>
                                        <InputGroup size="md">
                                            <InputLeftElement pointerEvents="none">RM</InputLeftElement>
                                            <Input
                                                variant="filled"
                                                id="shipping_threshold"
                                                bg="white"
                                                defaultValue={settings?.shipping_fee_threshold || 0}
                                                {
                                                    ...register("shipping_fee_threshold")
                                                }
                                                type='number'
                                                placeholder="Shipping Fee Threshold"
                                                focusBorderColor='blue.500'
                                            />
                                        </InputGroup>
                                        <FormHelperText>
                                            <Text color="blue.500">Order amount above this threshold will have free shipping</Text>
                                        </FormHelperText>
                                    </FormControl>                                
                                </Flex>
                                <Flex w="full" direction="row" gap={5}>
                                    <FormControl id="distance_threshold_for_standard_delivery_fee">
                                        <FormLabel>
                                            <Flex w="full" gap={2} alignItems="center">
                                                <GiPathDistance color="#d69511" />
                                                <Text fontWeight="600" color="gray.600">Distance Threshold For Standard Delivery Fee</Text>
                                            </Flex>      
                                        </FormLabel>
                                        <InputGroup size="md">
                                            <Input
                                                variant="filled"
                                                id="distance_threshold_for_standard_delivery_fee"
                                                bg="white"
                                                defaultValue={settings?.distance_threshold_for_standard_delivery_fee || 0}
                                                {
                                                    ...register("distance_threshold_for_standard_delivery_fee")
                                                }
                                                type='number'
                                                placeholder="Distance Threshold"
                                                focusBorderColor='blue.500'
                                            />
                                            <InputRightElement children="km" />
                                        </InputGroup>
                                        <FormHelperText>
                                            <Text color="blue.500">Distance threshold for standard delivery fee</Text>
                                        </FormHelperText>
                                    </FormControl>  
                                    <FormControl id="extra_delivery_charges_per_kilometer">
                                        <FormLabel>
                                            <Flex w="full" gap={2} alignItems="center">
                                                <FaPlus color="#d69511" />
                                                <Text fontWeight="600" color="gray.600">Extra Delivery Charges</Text>
                                            </Flex>      
                                        </FormLabel>
                                        <InputGroup size="md">
                                            <InputLeftElement pointerEvents="none">RM</InputLeftElement>
                                            <Input
                                                variant="filled"
                                                id="extra_delivery_charges_per_kilometer"
                                                bg="white"
                                                defaultValue={settings?.extra_delivery_charges_per_kilometer || 0}
                                                {
                                                    ...register("extra_delivery_charges_per_kilometer")
                                                }
                                                type='number'
                                                placeholder="Extra Delivery Charges Per Kilometer"
                                                focusBorderColor='blue.500'
                                            />
                                            <InputRightElement children="/km" />
                                        </InputGroup>
                                        <FormHelperText>
                                            <Text color="blue.500">Extra charges per kilometer for distance above threshold</Text>
                                        </FormHelperText>
                                    </FormControl>   
                                    <Flex w="full" gap={5}>
                                        <FormControl id="initial_delivery_time">
                                            <FormLabel>
                                                <Flex w="full" gap={2} alignItems="center">
                                                    <MdDateRange color="#d69511" />
                                                    <Text fontWeight="600" color="gray.600">Initial Delivery Time</Text>
                                                </Flex>      
                                            </FormLabel>
                                            <Select
                                                variant="filled"
                                                id="initial_delivery_time"
                                                bg="white"
                                                defaultValue={settings?.initial_delivery_time || ""}
                                                {
                                                    ...register("initial_delivery_time")
                                                }
                                                focusBorderColor='blue.500'
                                            >
                                                <option value="" disabled>Select Initial Delivery Time</option>
                                                <option value="6am">6 a.m.</option>
                                                <option value="7am">7 a.m.</option>
                                                <option value="8am">8 a.m.</option>
                                                <option value="9am">9 a.m.</option>
                                                <option value="10am">10 a.m.</option>
                                                <option value="11am">11 a.m.</option>
                                                <option value="12pm">12 p.m.</option>
                                                <option value="1pm">1 p.m.</option>
                                                <option value="2pm">2 p.m.</option>
                                                <option value="3pm">3 p.m.</option>
                                                <option value="4pm">4 p.m.</option>
                                                <option value="5pm">5 p.m.</option>
                                                <option value="6pm">6 p.m.</option>
                                            </Select>
                                        </FormControl>    
                                        <FormControl id="end_delivery_time">
                                            <FormLabel>
                                                <Flex w="full" gap={2} alignItems="center">
                                                    <MdDateRange color="#d69511" />
                                                    <Text fontWeight="600" color="gray.600">End Delivery Time</Text>
                                                </Flex>      
                                            </FormLabel>
                                            <Select
                                                variant="filled"
                                                id="end_delivery_time"
                                                bg="white"
                                                defaultValue={settings?.end_delivery_time || ""}
                                                {
                                                    ...register("end_delivery_time")
                                                }
                                                focusBorderColor='blue.500'
                                            >
                                                <option value="" disabled>Select End Delivery Time</option>
                                                <option value="6am">6 a.m.</option>
                                                <option value="7am">7 a.m.</option>
                                                <option value="8am">8 a.m.</option>
                                                <option value="9am">9 a.m.</option>
                                                <option value="10am">10 a.m.</option>
                                                <option value="11am">11 a.m.</option>
                                                <option value="12pm">12 p.m.</option>
                                                <option value="1pm">1 p.m.</option>
                                                <option value="2pm">2 p.m.</option>
                                                <option value="3pm">3 p.m.</option>
                                                <option value="4pm">4 p.m.</option>
                                                <option value="5pm">5 p.m.</option>
                                                <option value="6pm">6 p.m.</option>
                                            </Select>
                                        </FormControl>                                     
                                    </Flex>
                                </Flex>
                                <Flex w="full" direction="row" gap={5}>
                                    <FormControl id="special_handling_charges">
                                        <FormLabel>
                                            <Flex w="full" gap={2} alignItems="center">
                                                <CiWarning color="#d69511" />
                                                <Text fontWeight="600" color="gray.600">Special Handling Charges</Text>
                                            </Flex>      
                                        </FormLabel>
                                        <InputGroup size="md">
                                            <InputLeftElement pointerEvents="none">RM</InputLeftElement>
                                            <Input
                                                variant="filled"
                                                id="special_handling_charges"
                                                bg="white"
                                                defaultValue={settings?.special_handling_charges || 0}
                                                {
                                                    ...register("special_handling_charges")
                                                }
                                                type='number'
                                                placeholder="Special Handling Charges"
                                                focusBorderColor='blue.500'
                                            />
                                        </InputGroup>
                                        <FormHelperText>
                                            <Text color="blue.500">Special handling charges for all orders</Text>
                                        </FormHelperText>
                                    </FormControl>  
                                    <FormControl id="maximum_weight_load">
                                        <FormLabel>
                                            <Flex w="full" gap={2} alignItems="center">
                                                <TbWeight color="#d69511" />
                                                <Text fontWeight="600" color="gray.600">Maximum Weight Load</Text>
                                            </Flex>      
                                        </FormLabel>
                                        <InputGroup size="md">
                                            <Input
                                                variant="filled"
                                                id="maximum_weight_load"
                                                bg="white"
                                                defaultValue={settings?.maximum_weight_load || 0}
                                                {
                                                    ...register("maximum_weight_load")
                                                }
                                                type='number'
                                                placeholder="Maximum Weight Load"
                                                focusBorderColor='blue.500'
                                            />
                                            <InputRightElement children="kg" />
                                        </InputGroup>
                                        <FormHelperText>
                                            <Text color="blue.500">Maximum weight load for all orders</Text>
                                        </FormHelperText>
                                    </FormControl>  
                                    <FormControl id="extra_weight_fee_per_kilogram">
                                        <FormLabel>
                                            <Flex w="full" gap={2} alignItems="center">
                                                <BsCash color="#d69511" />
                                                <Text fontWeight="600" color="gray.600">Extra Weight Fee Per Kilogram</Text>
                                            </Flex>      
                                        </FormLabel>
                                        <InputGroup size="md">
                                            <InputLeftElement pointerEvents="none">RM</InputLeftElement>
                                            <Input
                                                variant="filled"
                                                id="extra_weight_fee_per_kilogram"
                                                bg="white"
                                                defaultValue={settings?.extra_weight_fee_per_kilogram || 0}
                                                {
                                                    ...register("extra_weight_fee_per_kilogram")
                                                }
                                                type='number'
                                                placeholder="Extra Weight Fee Per Kilogram"
                                                focusBorderColor='blue.500'
                                            />
                                            <InputRightElement children="/kg" />
                                        </InputGroup>
                                        <FormHelperText>
                                            <Text color="blue.500">Extra charges per kilogram for weight above maximum weight load</Text>
                                        </FormHelperText>
                                    </FormControl>  
                                </Flex>                  
                                <Flex w="full" direction="row" gap={5}>
                                    <FormControl id="cash_on_delivery_threshold">
                                        <FormLabel>
                                            <Flex w="full" gap={2} alignItems="center">
                                                <Text fontWeight="600" color="gray.600">Cash On Delivery Threshold</Text>
                                            </Flex>      
                                        </FormLabel>
                                        <InputGroup size="md">
                                            <InputLeftElement pointerEvents="none">RM</InputLeftElement>
                                            <Input
                                                variant="filled"
                                                id="cash_on_delivery_threshold"
                                                bg="white"
                                                defaultValue={settings?.cash_on_delivery_threshold || 0}
                                                {
                                                    ...register("cash_on_delivery_threshold")
                                                }
                                                type='number'
                                                placeholder="Cash On Delivery Threshold"
                                                focusBorderColor='blue.500'
                                            />
                                        </InputGroup>
                                        <FormHelperText>
                                            <Text color="blue.500">Orders above this threshold will not be able to use cash on delivery.</Text>
                                        </FormHelperText>
                                    </FormControl>  
                                    <FormControl id="e_wallet_threshold">
                                        <FormLabel>
                                            <Flex w="full" gap={2} alignItems="center">
                                                <Text fontWeight="600" color="gray.600">Touch 'n Go E-Wallet Threshold</Text>
                                            </Flex>      
                                        </FormLabel>
                                        <InputGroup size="md">
                                            <InputLeftElement pointerEvents="none">RM</InputLeftElement>
                                            <Input
                                                variant="filled"
                                                id="e_wallet_threshold"
                                                bg="white"
                                                defaultValue={settings?.e_wallet_threshold || 0}
                                                {
                                                    ...register("e_wallet_threshold")
                                                }
                                                type='number'
                                                placeholder="Touch 'n Go E-Wallet Threshold"
                                                focusBorderColor='blue.500'
                                            />
                                        </InputGroup>
                                        <FormHelperText>
                                            <Text color="blue.500">Orders above this threshold will not be able to use Touch 'n Go E-Wallet.</Text>
                                        </FormHelperText>
                                    </FormControl>  
                                </Flex>   
                                <Flex w="full" justifyContent="end" mt={2}>
                                    <Button colorScheme="blue" size="md" variant="solid" onClick={handleSubmit(onSubmit("shipping_settings"))}>Confirm & Submit</Button>
                                </Flex>           
                            </Flex>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Flex>
        </Flex>
    );
}

export default LogisticsSettings;