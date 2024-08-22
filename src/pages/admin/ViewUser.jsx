import {
    Box,
    Button,
    Center,
    Flex,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
    Avatar, 
    InputLeftElement,
    Text,
    useToast,
    HStack,
    Select,
} from '@chakra-ui/react';
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { IoMdArrowRoundBack } from "react-icons/io";
import { FaRegUser, FaGenderless } from "react-icons/fa";
import { MdOutlineAlternateEmail, MdDateRange } from "react-icons/md";
import { BiLinkExternal } from "react-icons/bi";
import { TbGenderMale, TbGenderFemale } from "react-icons/tb";
import { useEffect, useState } from "react";
import {registerNewUser} from "../../../api/auth.js";
import { useForm } from "react-hook-form";
import { useAuth } from "../../components/AuthCtx.jsx";
import { useParams, Link } from "react-router-dom";
import { db } from "../../../api/firebase";
import {onValue, query, ref} from "firebase/database";
import {GoogleMap, InfoWindow, Marker} from '@react-google-maps/api';

function ViewUser() {
    const {
		handleSubmit,
		register,
		formState: {
			errors
		}
	} = useForm();
    const { id } = useParams();
    const [ user, setUser ] = useState({});
    const [ addresses, setAddresses ] = useState([]);
    const [ selectedAddress, setSelectedAddress ] = useState(null);
    const [ showPassword, setShowPassword ] = useState(false);
    const roles = {
        "Admin": "Admin",
        "Logistics": "Logistics Admin",
        "Customer": "Customer",
        "Delivery": "Delivery Driver"
    }

    const mapStyle = {
        height: '39rem',
        width: '100%',
    };
    const libs = ['places'];
    const [mapRef, setMapRef] = useState(null);
    const [center, setCenter] = useState({
        lat: 5.4164,
        lng: 100.3327,
    });
    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapLoadError, setMapLoadError] = useState(null);

    const getMapsLink = (address) => {
        console.log(address);
        return `https://www.google.com/maps/search/?api=1&query=${address.name}`;
	};

    useEffect(() => {
        const userRef = ref(db, `users/${id}`);
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            setUser(data);
        });

        if (user?.role === "Customer") {
            const addressRef = ref(db, `users/${id}/addresses`);
            onValue(addressRef, (snapshot) => {
                const addresses = [];
                snapshot.forEach((childSnapshot) => {
                    addresses.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                setAddresses(addresses);
            });
        }
    }, [id]);

    useEffect(() => {
        if (user?.role === "Customer") {
            const addressRef = ref(db, `users/${id}/addresses`);
            onValue(addressRef, (snapshot) => {
                const addresses = [];
                const promises = [];
                snapshot.forEach((childSnapshot) => {
                    if (childSnapshot.val().place_id && window.google && window.google.maps) {
                        const service = new window.google.maps.places.PlacesService(mapRef);
                        const promise = new Promise((resolve) => {
                            service.getDetails(
                                {
                                    placeId: childSnapshot.val().place_id,
                                },
                                (result, status) => {
                                    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                                        addresses.push({
                                            id: childSnapshot.key,
                                            ...childSnapshot.val(),
                                            lat: result.geometry.location.lat(),
                                            lng: result.geometry.location.lng(),
                                        });
                                    } else {
                                        console.error(`Error retrieving place details: Status - ${status}`);
                                    }
                                    resolve(); 
                                }
                            );
                        });
                        promises.push(promise);
                    }
                });
        
                Promise.all(promises).then(() => {
                    console.log("Map addresses", addresses);
                    setAddresses(addresses);
                });
            });
        }
    }, [user, mapRef]);

    useEffect(() => {
        if (addresses.length > 0) {
            const latSum = addresses.reduce((acc, address) => acc + address.lat, 0);
            const lngSum = addresses.reduce((acc, address) => acc + address.lng, 0);
            setCenter({
                lat: latSum / addresses.length,
                lng: lngSum / addresses.length,
            });
        }
    }, [addresses]);

    const toast = useToast();

    const onSubmit = async (data) => {
        console.log(data);
    };

    return (
        <Flex w="full" bg="#f4f4f4" direction="column" alignItems="center" position="relative">
            <Flex w="full" direction="column" p={4}>
                {
                    user && user?.role === "Customer" ? (
                        <Flex w="full" direction="row" position="relative">
                            <Flex w="30%" h="39rem" direction="column" position="fixed" left="6">
                                <Flex w="full" h="full" direction="column" bg="white" shadow="md" rounded="md" p={7} gap={4} position="relative">
                                    <Flex position="absolute" top={20} left={20}>
                                        <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                                    </Flex>
                                    <Flex w="full" direction="row" gap={8} mb={2} alignItems="center" justifyContent="center">
                                        <Avatar size="2xl" name={user?.name} src={user?.profile_picture ? user?.profile_picture : "/src/assets/images/Default_User_Profile_2.png"} />
                                    </Flex>
                                    <Flex w="full" direction="column" gap={4}>
                                        <FormControl>
                                            <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                                Name
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftElement>
                                                    <Text fontSize="md" fontWeight="600" color="gray.600"><FaRegUser /></Text>
                                                </InputLeftElement>
                                                <Input 
                                                    variant="flushed"
                                                    type="text"
                                                    defaultValue={user.name}
                                                    color="gray.900"
                                                    size="md"
                                                    isReadOnly
                                                    w="full"
                                                />
                                            </InputGroup>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                                Email Address
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftElement>
                                                    <Text fontSize="md" fontWeight="600" color="gray.600"><MdOutlineAlternateEmail /></Text>
                                                </InputLeftElement>
                                                <Input 
                                                    variant="flushed"
                                                    type="email"
                                                    defaultValue={user.email}
                                                    color="gray.900"
                                                    size="md"
                                                    isReadOnly
                                                    w="full"
                                                />
                                            </InputGroup>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                                Contact Number
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftElement>
                                                    <Text fontSize="md" fontWeight="600" color="gray.600">+60</Text>
                                                </InputLeftElement>
                                                <Input 
                                                    variant="flushed"
                                                    type="text"
                                                    defaultValue={user.contact}
                                                    color="gray.900"
                                                    size="md"
                                                    isReadOnly
                                                    w="full"
                                                />                                    
                                            </InputGroup>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                                Gender
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftElement>
                                                    <Text fontSize="md" fontWeight="600" color="gray.600">
                                                        {user?.gender === "Male" && <TbGenderMale fontSize="md" fontWeight="600" color="gray.600" />}
                                                        {user?.gender === "Female" && <TbGenderFemale fontSize="md" fontWeight="600" color="gray.600" />}
                                                        {!user?.gender && <FaGenderless fontSize="md" fontWeight="600" color="gray.600" />}
                                                    </Text>
                                                </InputLeftElement>
                                                <Input 
                                                    variant="flushed"
                                                    type="text"
                                                    defaultValue={user?.gender}
                                                    color="gray.900"
                                                    size="md"
                                                    isReadOnly
                                                    w="full"
                                                />                                    
                                            </InputGroup>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                                Date of Birth
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftElement>
                                                    <Text fontSize="md" fontWeight="600" color="gray.600"><MdDateRange /></Text>
                                                </InputLeftElement>
                                                <Input 
                                                    variant="flushed"
                                                    type="text"
                                                    defaultValue={user?.date_of_birth}
                                                    color="gray.900"
                                                    size="md"
                                                    isReadOnly
                                                    w="full"
                                                />
                                            </InputGroup>
                                        </FormControl>
                                    </Flex>
                                </Flex>
                            </Flex>    
                            <Flex w="65%" position="fixed" right="6">
                                <GoogleMap
                                    onLoad={(map) => {
                                        setIsMapLoading(false);
                                        setMapRef(() => map);
                                    }}
                                    center={center}
                                    zoom={13}
                                    mapContainerStyle={mapStyle}
                                    options={{
                                        streetViewControl: false,
                                        mapTypeControl: false,
                                    }}
                                >
                                    {addresses.map((address) => (
                                        <Marker
                                            key={address.id}
                                            position={{ lat: address.lat, lng: address.lng }}
                                            onClick={() => setSelectedAddress(address)}
                                        />
                                    ))}

                                    {selectedAddress && (
                                        <InfoWindow
                                            position={{ lat: selectedAddress.lat + 0.0015, lng: selectedAddress.lng }}
                                            onCloseClick={() => setSelectedAddress(null)}
                                        >
                                            <Box p={1} maxW="sm">
                                                <Text fontSize="sm" fontWeight="medium">
                                                    {selectedAddress.name}
                                                </Text>
                                                <Text fontSize="xs" fontWeight="medium" color="gray.500" mt={1} mb={2}>
                                                    {selectedAddress.address}
                                                </Text>
                                                <Link
                                                    to={getMapsLink(selectedAddress)}
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
                        </Flex>
                    ) :
                    (
                        <Center h="full" bg={"#f4f4f4"}>
                            <Box w='85%' my={6}>
                                <Flex 	
                                    bg="white"
                                    boxShadow="xl"
                                    rounded="xl"
                                    p={3}
                                >
                                    <Box my={7} mx={5} w="full">
                                        <Flex w="full" direction="row" justifyContent="space-between" mb={4}>
                                            <Flex w="full" direction="row" alignContent="center" gap={4}>
                                                <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                                                <Text fontSize="2xl" fontWeight="700" color="#d69511">Edit User</Text>
                                            </Flex>
                                        </Flex>
                                        <form action="/api/add_new_user" method="post" onSubmit={handleSubmit(onSubmit)}>
                                            <Flex w="full" direction="row" gap={8}>
                                                <FormControl mb={2} mt={4} fontSize="sm" fontWeight="medium" color="gray.900" id="name" isInvalid={errors.name}>
                                                    <FormLabel>Name</FormLabel>
                                                    <Input
                                                            variant="filled"
                                                            type="text"
                                                            name="name"
                                                            defaultValue={user?.name || ""}
                                                            id="name"
                                                            placeholder="John Doe"
                                                            rounded="md"
                                                            borderWidth="1px"
                                                            borderColor="gray.300"
                                                            color="gray.900"
                                                            size="md"
                                                            focusBorderColor="blue.500"
                                                            w="full"
                                                            p={2.5}
                                                            {
                                                            ...register("name", {
                                                                required: "Name is required",
                
                                                            })
                                                        }
                                                    />
                                                    <FormErrorMessage>
                                                        {errors.name && errors.name.message}
                                                    </FormErrorMessage>
                                                </FormControl>
                                                <FormControl mb={2} mt={4} fontSize="sm" fontWeight="medium" color="gray.900" id="email" isInvalid={errors.email}>
                                                    <FormLabel>Email</FormLabel>
                                                    <Input
                                                        variant="filled"
                                                        type="email"
                                                        name="email"
                                                        id="email"
                                                        defaultValue={user?.email || ""}
                                                        placeholder="john.doe@gmail.com"
                                                        rounded="md"
                                                        borderWidth="1px"
                                                        borderColor="gray.300"
                                                        color="gray.900"
                                                        size="md"
                                                        focusBorderColor="blue.500"
                                                        w="full"
                                                        p={2.5}
                                                        {
                                                            ...register("email", {
                                                                required: "Email is required",
                
                                                            })
                                                        }
                                                    />
                                                    <FormErrorMessage>
                                                        {errors.email && errors.email.message}
                                                    </FormErrorMessage>
                                                </FormControl>                                
                                            </Flex>
                                            <Flex w="full" direction="row" gap={8}>
                                                <FormControl mb={2} mt={4} fontSize="sm" fontWeight="medium" color="gray.900"  id="contact" isInvalid={errors.contact}>
                                                    <FormLabel>Contact</FormLabel>
                                                    <Input
                                                        variant="filled"
                                                        type="tel"
                                                        name="contact"
                                                        id="contact"
                                                        defaultValue={user?.contact || ""}
                                                        placeholder="+60 12-345 6789"
                                                        rounded="md"
                                                        borderWidth="1px"
                                                        borderColor="gray.300"
                                                        color="gray.900"
                                                        size="md"
                                                        focusBorderColor="blue.500"
                                                        w="full"
                                                        p={2.5}
                                                        {
                                                            ...register("contact", {
                                                                required: "Contact Number is required",
                                                                pattern: {
                                                                    value: /^(\+?\d{1,3}[- ]?)?\d{10}$/,
                                                                    message: "Invalid contact number format",
                                                                },
                                                            })
                                                        }
                                                    />
                                                    <FormErrorMessage>
                                                        {errors.contact && errors.contact.message}
                                                    </FormErrorMessage>
                                                </FormControl>          
                                                <FormControl mb={2} mt={4} fontSize="sm" fontWeight="medium" color="gray.900"  id="contact" isInvalid={errors.role}>
                                                    <FormLabel>Role</FormLabel>
                                                    <Select
                                                        variant="filled"
                                                        type="text"
                                                        id="role"
                                                        placeholder="Select Role"
                                                        defaultValue={user?.role || ""} // Set default value to the role from user.role
                                                        rounded="md"
                                                        {...register("role", {
                                                            required: "Role is required"
                                                        })}
                                                        borderWidth="1px"
                                                        borderColor="gray.300"
                                                        color="gray.900"
                                                        size="md"
                                                        focusBorderColor="blue.500"
                                                        w="full"
                                                    >
                                                        {Object.entries(roles).map(([roleKey, roleName]) => ( // Map over entries of roles object
                                                            <option key={roleKey} value={roleKey} selected={roleKey === user?.role}>
                                                                {roleName} {/* Display role name */}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                    <FormErrorMessage>
                                                        {errors.role && errors.role.message}
                                                    </FormErrorMessage>
                                                </FormControl>                                                      
                                            </Flex>
                
                                            <Flex w="full" direction="row" gap={8}>
                                                <FormControl mb={2} mt={4} fontSize="sm" fontWeight="medium" color="gray.900"  id="password" isInvalid={errors.password}>
                                                    <FormLabel>Password</FormLabel>
                                                    <InputGroup>
                                                        <Input
                                                            type={showPassword ? 'text' : 'password'}
                                                            variant="filled"
                                                            name="password"
                                                            id="password"
                                                            placeholder="•••••••••"
                                                            rounded="md"
                                                            borderWidth="1px"
                                                            borderColor="gray.300"
                                                            color="gray.900"
                                                            defaultValue={user?.password || ""}
                                                            size="md"
                                                            focusBorderColor="blue.500"
                                                            w="full"
                                                            p={2.5}
                                                            {
                                                                ...register("password", {
                                                                    required: "Password is required",
                                                                    pattern: {
                                                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&])[A-Za-z\d@$!%#*?&]{8,}$/,
                                                                        message: "Invalid password format",
                                                                    },
                                                                })
                                                            }
                                                        />
                                                        <InputRightElement>
                                                            <IconButton aria-label="Show password" size="lg" variant="ghost"
                                                                icon={showPassword ? <IoMdEyeOff/> : <IoMdEye/>}
                                                                _focus={{bg: "transparent", borderColor: "transparent", outline: "none"}}
                                                                _hover={{bg: "transparent", borderColor: "transparent", outline: "none"}}
                                                                _active={{bg: "transparent", borderColor: "transparent", outline: "none"}}
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                tabIndex="-1"
                                                            />
                                                        </InputRightElement>
                                                    </InputGroup>
                                                    {
                                                        errors.password ?
                                                            <FormErrorMessage>
                                                                {errors.password && errors.password.message}
                                                            </FormErrorMessage> :
                                                            <FormHelperText fontSize="xs">
                                                                Minimum eight characters, at least one uppercase letter, one lowercase letter,
                                                                one number and one special character
                                                            </FormHelperText>
                                                    }
                                                </FormControl>                                   
                                            </Flex>
                
                                            <Button
                                                type="submit"
                                                colorScheme="blue"
                                                rounded="md"
                                                px={4}
                                                py={2}
                                                mt={8}
                                                w="full"
                                            >
                                                Confirm & Update
                                            </Button>
                                        </form>
                                    </Box>
                                </Flex>
                            </Box>
                        </Center>
                    )
                }

            </Flex>
        </Flex>
    );
}

export default ViewUser;
