import React, { useState } from 'react';
import { 
    Box, 
    Input, 
    Button, 
    Image, 
    FormControl, 
    FormLabel, 
    Flex, 
    Heading, 
    Text, 
    Icon, 
    HStack 
} from '@chakra-ui/react';
import { BsFillCloudArrowDownFill } from 'react-icons/bs';
import { FaPaintBrush, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LayoutCustomization = () => {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState(null);
    const [width, setWidth] = useState('');
    const [length, setLength] = useState('');
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const navigate = useNavigate();  // for navigation

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const handleVariantImageDragEnter = () => setIsDraggingImage(true);
    const handleVariantImageDragLeave = () => setIsDraggingImage(false);
    const handleVariantImageDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setUploadedFile(file);
        }
        setIsDraggingImage(false);
    };
    const handleVariantImageDragOver = (e) => e.preventDefault();

    const handleUpload = async () => {
        if (!uploadedFile || !width || !length) {
            alert('Please upload a file and provide layout dimensions.');
            return;
        }

        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('width', width);
        formData.append('length', length);

        try {
            const response = await fetch('http://localhost:5000/crop-floorplan', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                console.log('Image cropped successfully');
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                setCroppedImageUrl(imageUrl);
            } else {
                console.error('Failed to crop the image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    // Stepper component
    const Stepper = () => (
        <Flex justify="center" align="center" mt={6}>
            <HStack spacing={4}>
                <Flex direction="column" align="center">
                    <Icon as={BsFillCloudArrowDownFill} w={8} h={8} color="blue.500" />
                    <Text mt={2} fontSize="sm">Upload</Text>
                </Flex>

                <Box w="40px" h="1px" bg="gray.400"></Box>

                <Flex direction="column" align="center">
                    <Icon as={FaPaintBrush} w={8} h={8} color="gray.500" />
                    <Text mt={2} fontSize="sm">Customize</Text>
                </Flex>
            </HStack>
        </Flex>
    );

    return (
        <Flex w="full" bg="#f4f4f4" direction="column" alignItems="center" p={4}>
            <Box p={6} mx="auto" bg="gray.50" borderRadius="md" boxShadow="lg">
                <Stepper />
                <Flex w="full" direction="row" gap={4}>
                    <Flex w="full" direction="column">
                        <Text fontSize="lg" fontWeight="700" textAlign="center" my={3}>Customize Your Floorplan!</Text>
                        <Flex direction="column" gap={4}>
                            <FormControl>
                                <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                    Upload Floor Plan <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                </FormLabel>
                                <Box
                                    onDragEnter={handleVariantImageDragEnter}
                                    onDragOver={handleVariantImageDragOver}
                                    onDragLeave={handleVariantImageDragLeave}
                                    onDrop={handleVariantImageDrop}
                                    rounded="lg"
                                    borderWidth="2px"
                                    border={"dashed"}
                                    borderColor={isDraggingImage ? "blue.500" : "gray.300"}
                                    p={4}
                                    textAlign="center"
                                    position={"relative"}
                                    cursor="pointer"
                                >
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        opacity={0}
                                        width="100%"
                                        height="100%"
                                        position="absolute"
                                        top={0}
                                        left={0}
                                        zIndex={1}
                                        cursor="pointer"
                                        onChange={handleFileChange}
                                        isRequired
                                    />
                                    <Flex direction="column" alignItems="center">
                                        <BsFillCloudArrowDownFill
                                            size={32}
                                            color={isDraggingImage ? "blue" : "gray"}
                                        />
                                        <Text mb={2} fontSize="sm" fontWeight="semibold">
                                            {isDraggingImage ? "Drop the file here" : "Drag & Drop or Click to upload"}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                            (SVG, PNG, JPG, or JPEG)
                                        </Text>
                                    </Flex>
                                </Box>
                            </FormControl>

                            <Flex gap={4}>
                                <FormControl>
                                    <FormLabel>Width (in meters)</FormLabel>
                                    <Input
                                        type="number"
                                        value={width}
                                        onChange={(e) => setWidth(e.target.value)}
                                        placeholder="Enter width"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Length (in meters)</FormLabel>
                                    <Input
                                        type="number"
                                        value={length}
                                        onChange={(e) => setLength(e.target.value)}
                                        placeholder="Enter length"
                                    />
                                </FormControl>
                            </Flex>

                            <Button colorScheme="blue" onClick={handleUpload} mt={4} isFullWidth style={{ outline:'none' }}>
                                Upload and Crop
                            </Button>
                        </Flex>                        
                    </Flex>
                    {croppedImageUrl && (
                        <Flex w="full" direction="column">
                            <Flex direction="column" textAlign="center" gap={3}>
                                <Text fontSize="lg" fontWeight="700" textAlign="center" my={3}>Cropped Floorplan Preview</Text>
                                <Image
                                    src={croppedImageUrl}
                                    alt="Cropped Floor Plan"
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor="gray.300"
                                />
                            </Flex>

                            <Button
                                colorScheme="green"
                                mt={6}
                                style={{ outline:'none' }}
                                isFullWidth
                                onClick={() => navigate('/personalize-your-floorplan', {
                                    state: { croppedImageUrl, width, length }
                                })}
                            >
                                Satisfied? Proceed With Customization
                            </Button>
                        </Flex>
                    )}
                </Flex>

            </Box>
        </Flex>
    );
};

export default LayoutCustomization;
