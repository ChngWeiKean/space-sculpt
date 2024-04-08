import {
	Text,
    Flex,
    Box,
    Button,
    Avatar,
    Menu,
    MenuButton,
    Center,
    MenuList,
    MenuItem,
    MenuDivider,
    Input,
    FormControl,
    FormLabel,
    FormErrorMessage,
    Textarea,
} from "@chakra-ui/react";
import {useRef, useState, useEffect, memo, useCallback} from "react";
import {BsFillCloudArrowDownFill} from "react-icons/bs";
import {useForm} from "react-hook-form";

function AddCategory() {
    const {
        handleSubmit,
        register,
        formState: {
            errors, isSubmitting
        }
    } = useForm();

    const [isDragActive, setIsDragActive] = useState(false);
	const [imageSrc, setImageSrc] = useState(null);
	
	const previewImageRef = useRef(null);
	const previewImageContainerRef = useRef(null);

    const handleDragEnter = (e) => {
		e.preventDefault();
		setIsDragActive(true);
	};
	
	const handleDragOver = (e) => {
		e.preventDefault();
		setIsDragActive(true);
	};
	
	const handleDragLeave = () => {
		setIsDragActive(false);
	};
	
	const populatePreviewImage = (file) => {
		if (file) {
			console.log(file);
			// Read the file and set the image source
			const reader = new FileReader();
			reader.onload = (event) => {
				setImageSrc(event.target.result);
			};
			reader.readAsDataURL(file);
		} else {
			console.log("No file");
			setImageSrc(null);
		}
	}
	
	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragActive(false);
		const file = e.dataTransfer.files[0];
		populatePreviewImage(file);
		
		if (file) {
			setImage(file);
		} else {
			setImage(null);
		}
	};
	
	const handleFileInputChange = (e) => {
		const file = e.target.files[0];
		populatePreviewImage(file);
		
		if (file) {
			setImage(file);
		} else {
			setImage(null);
		}
	};

    const onSubmit = async (data) => {

		console.log("Adding Category");

    }

    return (
        <Flex w="full" justifyContent="center" p={4}>
            <Box w="90%" h="auto" bg="white" boxShadow="md" p={10}>
                <Flex w="full" direction="column">
                    <Text fontSize="2xl" fontWeight="700" color="#d69511" mb={12}>Add New Category</Text>
                    <form action="/api/add-category" method="post" onSubmit={handleSubmit(onSubmit)}>
                        <Flex w="full" direction="column" gap={6}>
                            <Flex w="full" direction="row" gap={6}>
                                <Flex w="full" direction="column" gap={6}>
                                    <FormControl isInvalid={errors.category_name}>
                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900" requiredIndicator>
                                            Category Name <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                        </FormLabel>
                                        <Input
                                            variant="filled"
                                            type="text"
                                            id="category_name"
                                            {
                                                ...register("category_name", {
                                                    required: "Category name cannot be empty",
                                                })
                                            }
                                            placeholder="Kitchenware"
                                            rounded="xl"
                                            borderWidth="1px"
                                            borderColor="gray.300"
                                            color="gray.900"
                                            size="md"
                                            focusBorderColor="blue.500"
                                            w="full"
                                            p={2.5}
                                        />
                                        <FormErrorMessage>
                                            {errors.category_name && errors.category_name.message}
                                        </FormErrorMessage>
                                    </FormControl>            
                                    <FormControl>
                                        <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                            Category Image <Text as="span" color="red.500" fontWeight="bold">*</Text>
                                        </FormLabel>
                                        <Box
                                            onDragEnter={handleDragEnter}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            rounded="lg"
                                            borderWidth="2px"
                                            border={"dashed"}
                                            borderColor={isDragActive ? "blue.500" : "gray.300"}
                                            p={8}
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
                                                isRequired
                                                onChange={handleFileInputChange}
                                            />
                                            <Flex direction="column" alignItems="center">
                                                <BsFillCloudArrowDownFill
                                                    onDragEnter={handleDragEnter}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    size={32}
                                                    color={isDragActive ? "blue" : "gray"}
                                                />
                                                <Text mb={2} fontSize="sm" fontWeight="semibold">
                                                    {isDragActive ? "Drop the file here" : "Drag & Drop or Click to upload"}
                                                </Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    (SVG, PNG, JPG, or JPEG)
                                                </Text>
                                            </Flex>
                                        </Box>
                                    </FormControl>                    
                                </Flex>    
                                <Box
                                    w="full"
                                    h="auto"
                                    id="preview-image-container"
                                    bg={!imageSrc ? "gray.200" : "transparent"}
                                    rounded="lg"
                                    display="flex"
                                    flexDir="column"
                                    alignItems="center"
                                    justifyContent="center"
                                    mt={4}
                                    ref={previewImageContainerRef}
                                >
                                    <img
                                        id="preview-image"
                                        src={imageSrc || ""}
                                        alt={imageSrc ? "Preview" : ""}
                                        display={imageSrc ? "block" : "none"}
                                        ref={previewImageRef}
                                        w="full"
                                        height="auto"
                                        objectFit="cover"
                                    />
                                </Box>                            
                            </Flex>


                        </Flex>
                    </form>
                </Flex>
            </Box>
        </Flex>
    );
}

export default AddCategory;