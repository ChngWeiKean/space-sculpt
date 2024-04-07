import {
    Button,
    Flex,
	Text,
    Box
} from "@chakra-ui/react";
import {useState} from "react";
import { GoArrowRight } from "react-icons/go";

function CustomerHome() {
    const categories = [
        { name: "Chairs", imageUrl: "https://source.unsplash.com/random" },
        { name: "Sofas", imageUrl: "https://source.unsplash.com/random" },
        { name: "Tables", imageUrl: "https://source.unsplash.com/random" },
        { name: "Beds", imageUrl: "https://source.unsplash.com/random" },
        { name: "Desks", imageUrl: "https://source.unsplash.com/random" },
        { name: "Cabinets", imageUrl: "https://source.unsplash.com/random" },
        { name: "Bookshelves", imageUrl: "https://source.unsplash.com/random" },
        { name: "Dressers", imageUrl: "https://source.unsplash.com/random" },
        { name: "Desks", imageUrl: "https://source.unsplash.com/random" },
        { name: "Cabinets", imageUrl: "https://source.unsplash.com/random" },
        { name: "Bookshelves", imageUrl: "https://source.unsplash.com/random" },
        { name: "Dressers", imageUrl: "https://source.unsplash.com/random" },
        { name: "Desks", imageUrl: "https://source.unsplash.com/random" },
    ];

    return (
        <Flex w="full" h="auto" bg="#f4f4f4" direction="column" alignItems="center">
            <Flex w="full" h="30rem" p={6} gap={5}>
                <Flex w="50%">
                    <img 
                        w="full" 
                        h="full" 
                        src="\src\assets\images\Landing_Header_Image_2_nobg_cropped.png" 
                        alt="Landing Header Image" 
                        style={{ width: "100%", objectFit: "contain" }}
                    />
                </Flex>                
                <Flex w="50%" direction="column">
                    <Text fontSize="sm" letterSpacing="wide">TRENDY COLLECTIONS</Text>
                    <Flex w="full" alignItems="center" direction="row" gap={2}>
                        <Text fontSize="5xl" fontWeight="700">Make Your</Text>
                        <Text fontSize="5xl" color="#d69511" fontWeight="700">Interior</Text>
                    </Flex>
                    <Text fontSize="5xl" fontWeight="700">Unique & Modern</Text>
                    <Text mt={2} fontSize="lg" color="gray.500" fontWeight="600">Transform Your Space, One Piece at a Time</Text>
                    <Flex w="full" direction="row" alignItems="center" mt={6} gap={10}>
                        <Button colorScheme="yellow" variant="solid" rightIcon={<GoArrowRight />} _focus={{ outline: "none" }} as="a">
                            <Text fontSize="lg" fontWeight="600">Shop Now</Text>
                        </Button>
                        <Text fontSize="md" color="gray.400" fontWeight="500">Used by 100,00 people globally.</Text>
                    </Flex>
                </Flex>
            </Flex>
            <Flex w="85%" p={6} direction="column" >
                <Text fontSize="lg" fontWeight="700" letterSpacing="wide">Browse by Category</Text>
                <Flex 
                    direction="row" 
                    gap={5} 
                    overflowX="scroll" 
                    overflowY="hidden"
                    sx={{ 
                        '&::-webkit-scrollbar': {
                            width: '3px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#f7d7b2',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: '#f1f1f1',
                        },
                    }}
                >
                    {categories.map((category, index) => (
                        <Box key={index} direction="column" alignItems="center" minW="200px" minH="200px" maxW="200px" maxH="200px" p={4} bgColor="#f8f8f8" borderRadius="md" mt={4}>
                            <img src={category.imageUrl} alt={category.name} style={{ width: "100%", height: "80%", objectFit: "cover" }} />
                            <Text mt={3} textAlign="center" fontSize="md" fontWeight="600">{category.name}</Text>
                        </Box>
                    ))}
                </Flex>
            </Flex>
        </Flex>
    );
}

export default CustomerHome;