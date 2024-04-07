import {Box, Center, Spinner} from "@chakra-ui/react";

const LoadingBuffer = () => {
	return (
		<Box w="full" h="100vh" bg="white" pos="fixed" top="0" left="0" zIndex="1000" display="flex" justifyContent="center" alignItems="center">
			<Center w="full" h="full">
				<Spinner size="xl" color="brand.900"/>
			</Center>
		</Box>
	)
}

export default LoadingBuffer;