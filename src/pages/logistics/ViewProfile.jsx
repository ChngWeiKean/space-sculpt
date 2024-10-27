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
    Text,
    useToast,
    Select,
} from '@chakra-ui/react';
import { db } from "../../../api/firebase";
import { useEffect, useState } from "react";
import { IoMdArrowRoundBack, IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useForm } from "react-hook-form";
import { onValue, ref } from "firebase/database";
import { Link, useParams } from 'react-router-dom';
import { updateUserProfile } from '../../../api/admin.js';

function ViewProfile() {
    const {
		handleSubmit,
		register,
		formState: {
			errors
		}
	} = useForm();
    const { id } = useParams();
    const [ user, setUser ] = useState({});
    const [ showPassword, setShowPassword ] = useState(false);
    const roles = {
        "Admin": "Admin",
        "Logistics": "Logistics Admin",
        "Customer": "Customer",
        "Delivery": "Delivery Driver"
    };

    useEffect(() => {
        const userRef = ref(db, `users/${id}`);
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            setUser(data);
        });
    }, [id]);

    const toast = useToast();

    const onSubmit = async (data) => {
        const userData = {
            name: data.name,
            email: data.email,
            contact: data.contact,
            role: data.role,
            password: data.password,
        }

        try {
            await updateUserProfile(id, userData);
            toast({
                title: "Profile updated successfully.",
                description: "User profile has been updated successfully.",
                status: "success",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Profile update failed.",
                description: "An error occurred while updating user profile. Please try again later.",
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Flex w="full" bg="#f4f4f4" direction="column" alignItems="center" position="relative">
            <Flex w="full" direction="column" p={4}>
                <Center h="full" bg={"#f4f4f4"}>
                    <Box w='85%' my={6}>
                        <Flex 	
                            bg="white"
                            boxShadow="xl"
                            rounded="xl"
                            p={3}
                        >
                            <Box my={7} mx={5} w="full">
                                <Flex w="full" direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                                    <Flex w="auto" direction="row" alignContent="center" gap={4}>
                                        <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()} />
                                        <Text fontSize="2xl" fontWeight="700" color="#d69511">Edit User</Text>
                                    </Flex>
                                    {
                                        user?.role === "Delivery" && (
                                            <Text w="auto" as="a" href={`/view-orders/${id}`} textColor="blue.500" fontSize="sm" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
                                                View Orders
                                            </Text>                                            
                                        )
                                    }
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
            </Flex>
        </Flex>
    );
}

export default ViewProfile;