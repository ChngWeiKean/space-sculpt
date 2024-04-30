import {
	Box,
	Button,
	Center,
	Checkbox,
	Flex,
	FormControl,
	FormErrorMessage,
	FormLabel,
	IconButton,
	Image,
	Input,
	InputGroup,
	InputRightElement,
	Link,
	Text,
	useToast,
} from "@chakra-ui/react";
import {IoMdEye, IoMdEyeOff} from "react-icons/io";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {login} from "../../../api/auth.js";

function Login() {
    const {
        handleSubmit,
        register,
        formState: {
            errors, isSubmitting
        }
    } = useForm();
    const [show, setShow] = useState(false);
    const toast = useToast();
    
    const onSubmit = async (data) => {
		const res = await login(data);
		console.log(res);
		
		if (res) {
			if (res.error) {
				toast({
					title: "Login failed.",
					description: "Please try again with valid credentials.",
					status: "error",
					duration: 3000,
					isClosable: true,
					position: "top"
				});
			}
		}
    }

    return (
        <Center w="full" h="full" bg={"#f4f4f4"}>
            <Box w="85%">
                <Flex
                    bg="white"
                    boxShadow="xl"
                    rounded="xl"
                    p={3}
                    gridGap={4}
                    gridTemplateColumns="1fr 1fr"
                >
                <Box my={7} w="full">
                    <Box ml={10}>
                        <Text fontSize="xl" fontWeight="bold">
                            Space Sculpt
                        </Text>
                    </Box>
                    <Center my={3}>
                        <Image src="/src/assets/images/Space_Sculpt_Logo_nobg.png" alt="Login" w="96" h="80" />
                    </Center>
                </Box>
                <Box my={7} mr={5} w="full">
                    <form action="/api/login" method="post" onSubmit={handleSubmit(onSubmit)}>
                        <Text fontSize="xl" fontWeight="bold" mb={7}>
                            Log In
                        </Text>
                        <Box>
                            <FormControl isInvalid={errors.email}>
                                <FormLabel mb={2} mt={7} fontSize="sm" fontWeight="medium" color="gray.900">
                                    Email
                                </FormLabel>
                                <Input
                                    variant="filled"
                                    type="email"
                                    id="email"
                                    {
                                        ...register("email", {
                                            required: "Email is required",
                                        })
                                    }
                                    placeholder="john.doe@gmail.com"
                                    rounded="md"
                                    borderWidth="1px"
                                    borderColor="gray.300"
                                    color="gray.900"
                                    size="md"
                                    focusBorderColor="blue.500"
                                    p={2.5}
                                />
                                <FormErrorMessage>
                                    {errors.email && errors.email.message}
                                </FormErrorMessage>
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl isInvalid={errors.password}>
                                <FormLabel mb={2} mt={4} fontSize="sm" fontWeight="medium" color="gray.900">
                                    Password
                                </FormLabel>
                                <InputGroup size='md'>
                                    <Input
                                        variant="filled"
                                        type={show ? "text" : "password"}
                                        id="password"
                                        {
                                            ...register("password", {
                                                required: "Password is required",
                                            })
                                        }
                                        placeholder="•••••••••"
                                        rounded="md"
                                        borderWidth="1px"
                                        borderColor="gray.300"
                                        color="gray.900"
                                        size="md"
                                        focusBorderColor="blue.500"
                                        p={2.5}
                                    />
                                    <InputRightElement>
                                        <IconButton
                                            aria-label="Show password"
                                            size="lg"
                                            variant="ghost"
                                            icon={show ? <IoMdEyeOff /> : <IoMdEye />}
                                            _focus={{ bg: "transparent", borderColor: "transparent", outline: "none" }}
                                            _hover={{ bg: "transparent", borderColor: "transparent", outline: "none" }}
                                            _active={{ bg: "transparent", borderColor: "transparent", outline: "none" }}
                                            onClick={() => setShow(!show)}
                                            tabIndex="-1"
                                        />
                                    </InputRightElement>
                                </InputGroup>
                                <FormErrorMessage>
                                    {errors.password && errors.password.message}
                                </FormErrorMessage>
                            </FormControl>
                        </Box>
                        <Flex alignItems="center" justifyContent="space-between" mt={6}>
                            <Flex alignItems="center">
                                <Checkbox name="remember" id="remember" mr={2} />
                                <Text htmlFor="remember">Remember me</Text>
                            </Flex>
                            <Text as="a" href="/forgot" textColor="blue.500" fontSize="sm" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
                                Forgot password?
                            </Text>
                        </Flex>
                        <Button
                            type="submit"
                            colorScheme="blue"
                            rounded="xl"
                            px={4}
                            py={2}
                            mt={12}
                            w="full"
                        >
                            Log In
                        </Button>
                        <Text textAlign="center" mt={5}>
                            Don't have an account?{" "}
                            <Text as="a" href="/register" textColor="blue.500" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
                                Sign Up
                            </Text>
                        </Text>
                    </form>
                </Box>
                </Flex>
            </Box>
        </Center>
    )
}

export default Login;