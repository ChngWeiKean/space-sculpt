import {
	Text,
    Flex,
    Box,
    Button,
    Input,
    FormControl,
    FormLabel,
    InputGroup,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { BsCart3 } from "react-icons/bs";
import { LiaShippingFastSolid } from "react-icons/lia";
import { useAuth } from "../../components/AuthCtx.jsx";
import { db } from "../../../api/firebase";
import '../../../node_modules/primereact/resources/themes/lara-light-blue/theme.css';
import { onValue, ref } from "firebase/database";
import { redeemVoucher } from "../../../api/customer.js";

function CustomerVouchers() {
    const { user } = useAuth();
    const [ vouchers, setVouchers ] = useState(null);
    const [ voucherCode, setVoucherCode ] = useState(null);

    useEffect(() => {
        const voucherRef = ref(db, `vouchers`);
        if (!user.vouchers) {
            return;
        }
        const voucherCodes = Object.keys(user?.vouchers).filter(voucherCode => user?.vouchers[voucherCode]);
        onValue(voucherRef, (snapshot) => {
            const data = snapshot.val();
            const userVouchers = {};
            voucherCodes.forEach(voucher => {
                userVouchers[voucher] = data[voucher];
            });
            console.log(userVouchers);
            setVouchers(userVouchers);
        });
    }, [user]);

    const handleRedeemVoucher = async (voucherCode) => {
        try {
            const response = await redeemVoucher(voucherCode, user.uid);
            if (response.error) {
                toast({
                    title: "Error",
                    description: response.error,
                    status: "error",
                    position: "top",
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: "Success",
                    description: "Voucher has been successfully redeemed.",
                    status: "success",
                    position: "top",
                    duration: 5000,
                    isClosable: true,
                });
            
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                position: "top",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Flex w="full" minH="full" bg="#f4f4f4" direction="column" alignItems="center">
            <Flex w="25rem" direction="column" alignItems="center" gap={3} mt={5}>
                <FormControl py={2}>
                    <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">Enter Voucher Code</FormLabel>
                    <InputGroup>
                        <Input
                            id="voucher"
                            variant="outline"
                            rounded="md"
                            borderWidth="1px"
                            borderColor="gray.300"
                            color="gray.900"
                            onChange={(e) => setVoucherCode(e.target.value)}
                            size="md"
                            focusBorderColor="blue.500"
                            p={2.5}
                        />       
                    </InputGroup>
                </FormControl>
                <Button
                    w="full"
                    colorScheme="blue"
                    size="md"
                    style={{ outline:'none' }}
                    onClick={() => handleRedeemVoucher(voucherCode)}
                >
                    Apply
                </Button>
                <Flex w="full" justifyContent="center" direction="column" gap={2}>
                    {
                        vouchers && Object.values(vouchers).map((voucher, index) => {
                            return (
                                <Box key={index} py={2}>
                                    <Flex
                                        minW="25rem"
                                        minH="10rem"
                                        maxW="25rem"
                                        maxH="10rem"
                                        direction="column"
                                        gap={2}
                                        px={6}
                                        roundedRight="md"
                                        cursor={"pointer"}
                                        style={{
                                            background: "linear-gradient(135deg, #7ed3d6, #7ed687)",
                                            position: 'relative',
                                            padding: '1rem',
                                        }}
                                    >
                                        {[...Array(9)].map((_, index) => (
                                            <Box
                                                my={2}
                                                key={index}
                                                position="absolute"
                                                top={`${(index * 20) + 2}px`}
                                                left="0%"
                                                transform="translate(-50%, -50%)"
                                                width="12px"
                                                height="12px"
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
                                            width="4px"
                                            height="100%"
                                            backgroundImage="linear-gradient(#f4f4f4 50%, transparent 50%)"
                                            backgroundSize="4px 20px"
                                            backgroundRepeat="repeat-y"
                                            zIndex="1"
                                        />
                                        <Box
                                            position="absolute"
                                            top="0"
                                            left="35%"
                                            transform="translate(-50%, -50%)"
                                            width="15px"
                                            height="15px"
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
                                            width="15px"
                                            height="15px"
                                            borderTopLeftRadius="50%"
                                            borderTopRightRadius="50%"
                                            bg="#f4f4f4"
                                            zIndex="2"
                                        />
                                        <Flex w="full" h="8rem">
                                            <Flex w="35%" h="8rem" alignItems="center" justifyContent="center">
                                                {voucher?.discount_application === "products" && (
                                                    <BsCart3 size="70px" color="#f4f4f4" />
                                                )}
                                                {voucher?.discount_application === "shipping" && (
                                                    <LiaShippingFastSolid size="70px" color="#f4f4f4" />
                                                )}
                                            </Flex>
                                            <Flex w="65%" h="8rem" direction="column" justifyContent="center" gap={2} ml={10}>
                                                <Flex w="full" gap={3} direction="row">
                                                    {voucher?.discount_type === "fixed" && (
                                                        <Text fontSize="5xl" fontWeight="600" color="#f4f4f4">RM</Text>
                                                    )}
                                                    {voucher?.discount_value && (
                                                        <Text fontSize="5xl" fontWeight="600" color="#f4f4f4">{voucher?.discount_value}</Text>
                                                    )}
                                                    {voucher?.discount_type === "percentage" && (
                                                        <Text fontSize="5xl" fontWeight="600" color="#f4f4f4">%</Text>
                                                    )}
                                                    {!voucher?.discount_value && !voucher?.discount_type && (
                                                        <Text fontSize="5xl" fontWeight="600" color="#f4f4f4">0</Text>
                                                    )}
                                                </Flex>
                                                <Flex direction="column">
                                                    <Text fontSize="md" fontWeight="600" color="#f4f4f4">Minimum Spend RM{voucher.minimum_spend}</Text>
                                                    <Text fontSize="sm" fontWeight="500" color="#f4f4f4">Expiries In {voucher.expiry_date}</Text>
                                                </Flex>
                                            </Flex>
                                        </Flex>
                                    </Flex>   
                                    <Accordion allowToggle>
                                        <AccordionItem>
                                            <AccordionButton style={{ outline:'none' }}>
                                                <Box flex="1" textAlign="left">
                                                    <Text fontSize="sm" fontWeight="600">Terms & Conditions</Text>
                                                </Box>
                                                <AccordionIcon />
                                            </AccordionButton>
                                            <AccordionPanel pb={4}>
                                                <Flex direction="column" gap={2}>
                                                    <Text fontSize="sm" fontWeight="600">{voucher.terms_and_conditions}</Text>
                                                </Flex>
                                            </AccordionPanel>
                                        </AccordionItem>
                                    </Accordion>                                                                                
                                </Box>                                
                            )
                        })
                    }          
                    {
                        !vouchers && (
                            <Flex w="full" h="full" direction="column" alignItems="center" justifyContent="center">
                                <Text fontSize="xl" fontWeight="600" color="#333">You have no vouchers.</Text>
                            </Flex>
                        )
                    }    
                </Flex>
            </Flex>
        </Flex>
    )
}

export default CustomerVouchers;