import {
	Text,
    Flex,
    Box,
    Button,
    Input,
    FormControl,
    FormLabel,
    FormErrorMessage,
    useToast,
    Divider,
    Select,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    InputLeftAddon,
    InputRightAddon,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill, BsCart3 } from "react-icons/bs";
import { LiaShippingFastSolid } from "react-icons/lia";
import { IoMdArrowRoundBack } from "react-icons/io";
import { FaPlus, FaTrash  } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { db } from "../../../api/firebase";
import { onValue, ref, query, orderByChild, equalTo, set } from "firebase/database";
import { addVoucher } from "../../../api/admin";

function AddVoucher() {
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const [vouchers, setVouchers] = useState([]);
    const discountType = watch("discount_type");
    const application = watch("discount_application");
    const discountValue = watch("discount_value");
    const minimumSpend = watch("minimum_spend");
    const expiryDate = watch("expiry_date");
    const toast = useToast();

    useEffect(() => {
        const vouchersRef = ref(db, "vouchers");
        const vouchersQuery = query(vouchersRef, orderByChild("voucher_code"));
        onValue(vouchersQuery, (snapshot) => {
            const vouchers = [];
            snapshot.forEach((childSnapshot) => {
                vouchers.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val(),
                });
            });
            setVouchers(vouchers);
        });
    }, []);

    function startOfDay(date) {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    }

    const onSubmit = async (data) => {
        let voucherData = {
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            start_date: data.start_date,
            expiry_date: data.expiry_date,
            discount_application: data.discount_application,
            minimum_spend: data.minimum_spend,
            customer_eligibility: data.customer_eligibility,
            voucher_code: data.voucher_code,
            auto_redemption_amount: data.auto_redemption_amount,
            redemption_limit: data.redemption_limit,
        }
        console.log(voucherData);

        // check if start date is before expiry date
        if (new Date(data.start_date) > new Date(data.expiry_date)) {
            toast({
                title: "Error",
                description: "Start date must be before expiry date",
                position: "top",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // Get today's date at the start of the day
        const today = startOfDay(new Date());

        // Get the start date from the form data and set it to the start of the day
        const startDate = startOfDay(new Date(data.start_date));

        // start date must be today onwards
        if (startDate < today) {
            toast({
                title: "Error",
                description: "Start date must be today onwards",
                position: "top",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // check if voucher code already exists
        if (vouchers.some((voucher) => voucher.voucher_code === data.voucher_code)) {
            toast({
                title: "Error",
                description: "Voucher code already exists",
                position: "top",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // check if discount value is between 0 and 100 if discount type is percentage
        if (data.discount_type === "percentage" && (data.discount_value < 0 || data.discount_value > 100)) {
            toast({
                title: "Error",
                description: "Discount value must be between 0 and 100",
                position: "top",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        } else if (data.discount_type === "fixed" && data.discount_value < 0) {
            toast({
                title: "Error",
                description: "Discount value must be greater than 0",
                position: "top",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // check if minimum spend is positive or zero
        if (data.minimum_spend < 0) {
            toast({
                title: "Error",
                description: "Minimum spend must be greater than 0",
                position: "top",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // check if auto redemption amount is 0 or less
        if (data.auto_redemption_amount < 0) {
            toast({
                title: "Error",
                description: "Auto redemption amount must be greater than 0",
                position: "top",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // check if redemption limit is greater than 0
        if (data.redemption_limit <= 0) {
            toast({
                title: "Error",
                description: "Redemption limit must be greater than 0",
                position: "top",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        try {
            await addVoucher(voucherData);
            toast({
                title: "Success",
                description: "Voucher added successfully",
                position: "top",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            window.history.back();
        }
        catch (error) {
            toast({
                title: "Error",
                description: "Error adding voucher",
                position: "top",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    }

    return (
        <Flex h="auto" bg="#f4f4f4" p={7}>
            <Flex w="full" h="full" direction="column" gap={6}>
                <Flex w="full" direction="row" justifyContent="space-between">
                    <Flex w="full" direction="row" alignContent="center" gap={4}>
                        <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                        <Text fontSize="2xl" fontWeight="700" color="#d69511">Add New Voucher</Text>
                    </Flex>
                    <Button colorScheme="blue" variant="solid" onClick={handleSubmit(onSubmit)}>Confirm & Submit</Button>
                </Flex>            
                <Flex w="full" h="full" direction="row" gap={5} position="relative">
                    <Flex w="50%" direction="column" justifyContent="end">
                        <form action="/api/add-voucher" method="post">
                            <Flex w="full" direction="column" gap={5}>
                                <Flex w="full" direction="column" gap={3}>
                                    <Text fontSize="xl" fontWeight="700" color="#d69511">Discount</Text>
                                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                    <Flex w="full" direction="row" gap={5}>     
                                        <FormControl isInvalid={errors.discount_type}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Discount Type
                                            </FormLabel>
                                            <Select
                                                variant="filled"
                                                id="discount_type"
                                                {
                                                    ...register("discount_type", {
                                                        required: "Discount type cannot be empty",
                                                    })
                                                }
                                                placeholder="Select discount type"
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                            >
                                                <option value="percentage">Percentage</option>
                                                <option value="fixed">Fixed</option>
                                            </Select>
                                            <FormErrorMessage>
                                                {errors.discount_type && errors.discount_type.message}
                                            </FormErrorMessage>
                                        </FormControl>     
                                        <FormControl isInvalid={errors.discount_value}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Discount Value
                                            </FormLabel>
                                            <InputGroup>
                                                {discountType === "fixed" && (
                                                    <InputLeftAddon children="RM" />
                                                )}
                                                <Input
                                                    variant="filled"
                                                    type="number"
                                                    id="discount_value"
                                                    {
                                                        ...register("discount_value", {
                                                            required: "Discount value cannot be empty",
                                                        })
                                                    }
                                                    rounded="md"
                                                    borderWidth="1px"
                                                    borderColor="gray.300"
                                                    color="gray.900"
                                                    size="md"
                                                    focusBorderColor="blue.500"
                                                    w="full"
                                                    p={2.5}
                                                />
                                                {discountType === "percentage" && (
                                                    <InputRightAddon children="%" />
                                                )}
                                            </InputGroup>
                                            <FormErrorMessage>
                                                {errors.discount_value && errors.discount_value.message}
                                            </FormErrorMessage>
                                        </FormControl> 
                                    </Flex>                                    
                                </Flex>
                                
                                <Flex w="full" direction="column" gap={3}>
                                    <Text fontSize="xl" fontWeight="700" color="#d69511">Voucher Dates</Text>
                                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>  
                                    <Flex w="full" direction="row" gap={5}>
                                        <FormControl isInvalid={errors.start_date}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Start Date
                                            </FormLabel>
                                            <Input
                                                variant="filled"
                                                type="date"
                                                id="start_date"
                                                {
                                                    ...register("start_date", {
                                                        required: "Start date cannot be empty",
                                                    })
                                                }
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                                p={2.5}
                                            />
                                            <FormErrorMessage>
                                                {errors.start_date && errors.start_date.message}
                                            </FormErrorMessage>
                                        </FormControl> 
                                        <FormControl isInvalid={errors.expiry_date}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Expiry Date
                                            </FormLabel>
                                            <Input
                                                variant="filled"
                                                type="date"
                                                id="expiry_date"
                                                {
                                                    ...register("expiry_date", {
                                                        required: "Expiry date cannot be empty",
                                                    })
                                                }
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                                p={2.5}
                                            />
                                            <FormErrorMessage>
                                                {errors.expiry_date && errors.expiry_date.message}
                                            </FormErrorMessage>
                                        </FormControl>         
                                    </Flex>                                    
                                </Flex>

                                <Flex w="full" direction="column" gap={3}>
                                    <Text fontSize="xl" fontWeight="700" color="#d69511">Other</Text>
                                    <Divider w={"full"} border={"1px"} orientation="horizontal"  borderColor="gray.300"/>
                                    <Flex w="full" direction="row" gap={5}>
                                        <FormControl isInvalid={errors.discount_application}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Applied For
                                            </FormLabel>
                                            <Select
                                                variant="filled"
                                                id="discount_application"
                                                {
                                                    ...register("discount_application", {
                                                        required: "Discount application cannot be empty",
                                                    })
                                                }
                                                placeholder="Select application"
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                            >
                                                <option value="products">Products</option>
                                                <option value="shipping">Shipping</option>
                                            </Select>
                                            <FormErrorMessage>
                                                {errors.discount_application && errors.discount_application.message}
                                            </FormErrorMessage>
                                        </FormControl>    
                                        <FormControl isInvalid={errors.minimum_spend}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Minimum Spend
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftAddon children="RM" />
                                                <Input
                                                    variant="filled"
                                                    type="number"
                                                    id="minimum_spend"
                                                    {
                                                        ...register("minimum_spend", {
                                                            required: "Minimum spend cannot be empty",
                                                        })
                                                    }
                                                    rounded="md"
                                                    borderWidth="1px"
                                                    borderColor="gray.300"
                                                    color="gray.900"
                                                    size="md"
                                                    focusBorderColor="blue.500"
                                                    w="full"
                                                    p={2.5}
                                                />                                                
                                            </InputGroup>
                                            <FormErrorMessage>
                                                {errors.minimum_spend && errors.minimum_spend.message}
                                            </FormErrorMessage>
                                        </FormControl>  
                                        <FormControl isInvalid={errors.customer_eligibility}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Customer Eligibility
                                            </FormLabel>
                                            <Select
                                                variant="filled"
                                                id="customer_eligibility"
                                                {
                                                    ...register("customer_eligibility", {
                                                        required: "Customer eligibility cannot be empty",
                                                    })
                                                }
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                            >
                                                <option value="all">All Customers</option>
                                                <option value="new">New Customers</option>
                                            </Select>
                                            <FormErrorMessage>
                                                {errors.customer_eligibility && errors.customer_eligibility.message}
                                            </FormErrorMessage>
                                        </FormControl> 
                                    </Flex>   
                                    <Flex w="full" direction="row" gap={5}> 
                                        <FormControl isInvalid={errors.voucher_code}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Voucher Code
                                            </FormLabel>
                                            <Input
                                                variant="filled"
                                                type="text"
                                                id="voucher_code"
                                                {
                                                    ...register("voucher_code", {
                                                        required: "Voucher code cannot be empty",
                                                    })
                                                }
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                                p={2.5}
                                            />
                                            <FormErrorMessage>
                                                {errors.voucher_code && errors.voucher_code.message}
                                            </FormErrorMessage>
                                        </FormControl>  
                                        <FormControl isInvalid={errors.auto_redemption_amount}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Auto Redemption Amount
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftAddon children="RM" />
                                                <Input
                                                    variant="filled"
                                                    type="number"
                                                    id="auto_redemption_amount"
                                                    {
                                                        ...register("auto_redemption_amount", {
                                                            required: "Auto redemption amount cannot be empty",
                                                        })
                                                    }
                                                    rounded="md"
                                                    borderWidth="1px"
                                                    borderColor="gray.300"
                                                    color="gray.900"
                                                    size="md"
                                                    focusBorderColor="blue.500"
                                                    w="full"
                                                    p={2.5}
                                                />
                                            </InputGroup>
                                            <FormErrorMessage>
                                                {errors.auto_redemption_amount && errors.auto_redemption_amount.message}
                                            </FormErrorMessage>
                                        </FormControl>  
                                        <FormControl isInvalid={errors.redemption_limit}>
                                            <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">
                                                Redemption Limit
                                            </FormLabel>
                                            <Input
                                                variant="filled"
                                                type="number"
                                                id="redemption_limit"
                                                {
                                                    ...register("redemption_limit", {
                                                        required: "Redemption limit cannot be empty",
                                                    })
                                                }
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                size="md"
                                                focusBorderColor="blue.500"
                                                w="full"
                                                p={2.5}
                                            />
                                            <FormErrorMessage>
                                                {errors.redemption_limit && errors.redemption_limit.message}
                                            </FormErrorMessage>
                                        </FormControl>  
                                    </Flex>                                 
                                </Flex>

                            </Flex>
                        </form>
                    </Flex>
                    <Flex w="50%" h="full" direction="column" position="fixed" top={60} right={-20}>
                        <Flex 
                            minW="37rem" 
                            minH="18rem" 
                            maxW="37rem" 
                            maxH="18rem" 
                            direction="column" 
                            gap={2} 
                            px={6}
                            py={2}
                            roundedRight="md" 
                            cursor={"pointer"}
                            transition="transform 0.2s" 
                            style={{
                                background: "linear-gradient(135deg, #7ed3d6, #7ed687)",
                                position: 'relative', 
                                padding: '1rem'
                            }}
                        >
                            {[...Array(9)].map((_, index) => (
                                <Box
                                    my={2}
                                    key={index}
                                    position="absolute"
                                    top={`${(index * 35) + 12}px`} 
                                    left="0%" 
                                    transform="translate(-50%, -50%)"
                                    width="20px"
                                    height="20px"
                                    borderLeftRadius="50%"
                                    borderRightRadius="50%"
                                    bg="#f4f4f4"
                                    zIndex="2"
                                />
                            ))}                               
                            <Box
                                position="absolute"
                                top="0"
                                left="35%"
                                transform="translateX(-50%)"
                                width="6px"
                                height="100%"
                                backgroundImage="linear-gradient(#f4f4f4 50%, transparent 50%)" 
                                backgroundSize="4px 40px"
                                backgroundRepeat="repeat-y" 
                                zIndex="1" 
                            />
                            <Box
                                position="absolute"
                                top="0"
                                left="35%"
                                transform="translate(-50%, -50%)"
                                width="20px"
                                height="20px"
                                borderBottomLeftRadius="50%"
                                borderBottomRightRadius="50%"
                                bg="#f4f4f4"
                                zIndex="2"
                            />

                            <Box
                                position="absolute"
                                bottom="0"
                                left="35%"
                                transform="translate(-50%, 50%)"
                                width="20px"
                                height="20px"
                                borderTopLeftRadius="50%"
                                borderTopRightRadius="50%"
                                bg="#f4f4f4"
                                zIndex="2"
                            />
                            <Flex w="full" h="16rem">
                                <Flex w="35%" h="16rem" alignItems="center" justifyContent="center">
                                    {
                                        application === "products" && (
                                            <BsCart3 size="100px" color="#f4f4f4"/>
                                        ) 
                                    }
                                    {
                                        application === "shipping" && (
                                            <LiaShippingFastSolid size="100px" color="#f4f4f4"/>
                                        )
                                    }
                                </Flex>
                                <Flex w="65%" h="16rem" direction="column" justifyContent="center" gap={2} ml={20}>
                                    <Flex w="full" gap={3} direction="row">
                                        {
                                            discountType === "fixed" && (
                                                <Text fontSize="8xl" fontWeight="600" color="#f4f4f4">RM</Text>
                                            )
                                        }                                             
                                        {
                                            discountValue && (
                                                <Text fontSize="8xl" fontWeight="600" color="#f4f4f4">{discountValue}</Text>
                                            )
                                        }            
                                        {
                                            discountType === "percentage" && (
                                                <Text fontSize="8xl" fontWeight="600" color="#f4f4f4">%</Text>
                                            )
                                        }
                                        {
                                            !discountValue && !discountType && (
                                                <Text fontSize="8xl" fontWeight="600" color="#f4f4f4">0</Text>
                                            )
                                        }             
                                    </Flex>
                                    <Flex direction="column">
                                        <Text fontSize="lg" fontWeight="600" color="#f4f4f4">Minimum Spend RM{minimumSpend}</Text>
                                        <Text fontSize="md" fontWeight="500" color="#f4f4f4">Expiries In {expiryDate}</Text>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Flex> 
                    </Flex>
                </Flex>                
            </Flex>
        </Flex>
    )
}

export default AddVoucher;