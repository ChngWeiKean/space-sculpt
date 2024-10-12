import {
    FormControl,
    FormLabel,
    Select,
    Tag,
    TagLabel,
    TagCloseButton,
    Box,
    Text
} from '@chakra-ui/react';

export const MultiSelect = ({ options, selectedOptions, setSelectedOptions, label, placeholder }) => {
    const handleSelectChange = (e) => {
        const value = e.target.value;
        if (!selectedOptions.includes(value) && value !== "") {
            setSelectedOptions([...selectedOptions, value]);
        }
    };

    const handleRemoveOption = (option) => {
        setSelectedOptions(selectedOptions.filter(item => item !== option));
    };

    return (
        <FormControl>
            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">{label}</FormLabel>
            <Select placeholder={placeholder} onChange={handleSelectChange}>
                {options.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </Select>
            
            <Box mt={2}>
                {selectedOptions.length === 0 ? (
                    <Text fontSize="xs" color="gray.500">No tags selected</Text>
                ) : (
                    selectedOptions.map((option, index) => (
                        <Tag
                            key={index}
                            size="md"
                            borderRadius="full"
                            variant="solid"
                            colorScheme="blue"
                            mr={2}
                            mt={2}
                        >
                            <TagLabel>{option}</TagLabel>
                            <TagCloseButton onClick={() => handleRemoveOption(option)} style={{ outline: 'none' }} />
                        </Tag>
                    ))
                )}
            </Box>
        </FormControl>
    );
};