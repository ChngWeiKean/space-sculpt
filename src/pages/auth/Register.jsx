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
    useToast
} from '@chakra-ui/react';
import {IoMdEye, IoMdEyeOff} from "react-icons/io";
import {useState} from "react";
import {register as registerUser} from "../../../api/auth.js";
import {useForm} from "react-hook-form";
import {useAuth} from "../../components/AuthCtx.jsx";

function Register() {
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
    const toast = useToast();
    
    const onSubmit = async (data) => {
        const password = data["password"];
        const confirm_password = data["confirm_password"];
        
        if (password !== confirm_password) {
            alert("Passwords do not match!");
            return;
        }
        const res = await registerUser(data);
        
		if (res) {
			if (res.error) {
                toast({
                    title: "Registration failed.",
                    description: "Please try again with valid credentials.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
			}
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
                    gridGap={4}
                    gridTemplateColumns="1fr 1fr"
                >
                    <Box my={7} ml={5} w="full">
                        <Box ml={10}>
							<Text fontSize="xl" fontWeight="bold">
								Space Sculpt
							</Text>
						</Box>
                        <Center p={10}>
                            <Image
                                src="/src/assets/svg/register.svg"
                                alt="Register"
                                w="auto"
                            />
                        </Center>
                    </Box>
                    <Box my={7} mr={5} w="full">
                        <Text fontSize="xl" fontWeight="bold" mb={7}>
                            Register
                        </Text>
                        <form action="/api/register" method="post" onSubmit={handleSubmit(onSubmit)}>
                                <FormControl mb={2} mt={7} fontSize="sm" fontWeight="medium" color="gray.900" id="name" isInvalid={errors.name}>
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
                                <Center>
                                    <Text>
                                        Already have an account?{' '}
                                        <Link color="blue.500" textDecoration="underline" href="/login">
                                            Log in here
                                        </Link>
                                    </Text>
                                </Center>
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

export default Register;
