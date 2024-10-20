import {
	Box,
	Button,
	Center,
	Flex,
	FormControl,
	FormErrorMessage,
	FormLabel,
	Grid,
	Image,
	Input,
	Text,
	useToast
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { db } from "../../../api/firebase";
import { onValue, ref } from "firebase/database";
import { forgot_password } from "../../../api/auth.js";

function ForgotPassword() {
	const {
		handleSubmit,
		register,
		formState: {
			errors
		}
	} = useForm();
	const toast = useToast();
	
	const onSubmit = async (data) => {
		const usersRef = ref(db, "users");
		const users = [];
		onValue(usersRef, (snapshot) => {
			const data = snapshot.val();
			for (let id in data) {
				users.push(data[id]);
			}
		});

		const user = users.find((user) => user.email === data.email);
		if (!user) {
			toast({
				title: "Email not found.",
				description: "Please try again with a valid email address.",
				status: "error",
				duration: 3000,
				isClosable: true,
				position: "top"
			});
			return;
		}

		const res = await forgot_password(data.email);

		if (res) {
			if (res.error) {
				toast({
					title: "Password reset email unsuccessful.",
					description: "Please try again.",
					status: "error",
					duration: 3000,
					isClosable: true,
					position: "top"
				});
			} else {
				toast({
					title: "Password reset email sent.",
					description: "Please check your email for instructions.",
					status: "success",
					duration: 3000,
					isClosable: true,
					position: "top"
				});
			}
		}
	}
	
	return (
		<Center h="full" bg={"#f4f4f4"}>
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
							<Image src="/src/assets/svg/login.svg" alt="Login" w="96" h="80" />
						</Center>
					</Box>
					<Box my={7} mr={5} w="full" h="full">
						<form action="/api/login" method="post" onSubmit={handleSubmit(onSubmit)}>
							<Text fontSize="xl" fontWeight="bold" mb={7}>
								Forgot Password
							</Text>
							<Grid templateRows="auto 1fr" w="100%" h="100%" overflow="hidden">
								<Box w="full" my={10}>
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
											rounded="xl"
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
									
									<Flex alignItems="center" mt={6}>
										<Text as="a" href="/login" textColor="blue.500" fontSize="sm" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
											Return to login
										</Text>
									</Flex>
								</Box>
								<Button
									type="submit"
									colorScheme="blue"
									rounded="xl"
									px={4}
									py={2}
									mt={12}
									w="full"
								>
									Request Password Reset
								</Button>
							</Grid>
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
	);
}

export default ForgotPassword
