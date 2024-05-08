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
    Image,
    Input,
    InputGroup,
    InputRightElement,
    Link,
    Text,
    useToast,
    Select,
} from '@chakra-ui/react';
import {IoMdEye, IoMdEyeOff} from "react-icons/io";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import {useState} from "react";
import {registerNewUser} from "../../../api/auth.js";
import {useForm} from "react-hook-form";
import {useAuth} from "../../components/AuthCtx.jsx";

function AddUser() {
    const {
		handleSubmit,
		register,
		formState: {
			errors, isSubmitting
		}
	} = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState(null);
    const {user, loading} = useAuth();
    const roles = {
        "Admin": "Admin",
        "Logistics": "Logistics Admin",
        "Customer": "Customer",
        "Delivery": "Delivery Driver"
    }
    const toast = useToast();
    
    const onSubmit = async (data) => {
        const password = data["password"];
        const confirm_password = data["confirm_password"];
        
        if (password !== confirm_password) {
            alert("Passwords do not match!");
            return;
        }

        const userData = {
            email: data.email,
            password: data.password,
            name: data.name,
            contact: data.contact,
            role: data.role
        }

        try {
            await registerNewUser(userData);
            toast({
                title: "User Added",
                description: "User has been added successfully",
                status: "success",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
            window.history.back();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "An error occurred while adding user",
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
        }
    }

    return (
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
                                <Text fontSize="2xl" fontWeight="700" color="#d69511">Add New User</Text>
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
                                        rounded="md"
                                        {
                                            ...register("role", {
                                                required: "Role is required"
                                            })
                                        }
                                        borderWidth="1px"
                                        borderColor="gray.300"
                                        color="gray.900"
                                        size="md"
                                        focusBorderColor="blue.500"
                                        w="full"
                                    >
                                        {
                                            Object.keys(roles).map((role) => {
                                                return <option key={role} value={role}>{roles[role]}</option>
                                            })
                                        }
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
                                <FormControl mb={2} mt={4} fontSize="sm" fontWeight="medium" color="gray.900"  id="confirm_password" isInvalid={errors.name}>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <InputGroup>
                                        <Input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirm_password"
                                            id="confirm_password"
                                            variant="filled"
                                            placeholder="•••••••••"
                                            rounded="md"
                                            borderWidth="1px"
                                            borderColor="gray.300"
                                            color="gray.900"
                                            size="md"
                                            focusBorderColor="blue.500"
                                            w="full"
                                            p={2.5}
                                            {
                                                ...register("confirm_password", {
                                                    required: "Confirm Password is required",
                                                    pattern: {
                                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
                                                        message: "Invalid password format",
                                                    },
                                                })
                                            }
                                        />
                                        <InputRightElement>
                                            <IconButton aria-label="Show password" size="lg" variant="ghost"
                                                icon={showConfirmPassword ? <IoMdEyeOff/> : <IoMdEye/>}
                                                _focus={{bg: "transparent", borderColor: "transparent", outline: "none"}}
                                                _hover={{bg: "transparent", borderColor: "transparent", outline: "none"}}
                                                _active={{bg: "transparent", borderColor: "transparent", outline: "none"}}
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                tabIndex="-1"
                                            />  
                                        </InputRightElement>
                                    </InputGroup>
                                    <FormErrorMessage>
                                        {errors.confirm_password && errors.confirm_password.message}
                                    </FormErrorMessage>
                                </FormControl>                                        
                            </Flex>

                            <Button
                                type="submit"
                                colorScheme="blue"
                                rounded="xl"
                                px={4}
                                py={2}
                                mt={8}
                                w="full"
                            >
                                Register
                            </Button>
                        </form>
                    </Box>
                </Flex>
            </Box>
        </Center>
    );
}

export default AddUser;
