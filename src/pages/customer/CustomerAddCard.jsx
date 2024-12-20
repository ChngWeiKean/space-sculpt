import {
	Text,
    Flex,
    Box,
    Button,
    Input,
    FormControl,
    FormLabel,
    InputLeftAddon,
    Textarea,
    useToast,
    InputGroup,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { CiCreditCard1 } from "react-icons/ci";
import { FaRegUser } from "react-icons/fa";
import { MdDateRange, MdOutlineSecurity } from "react-icons/md";
import { useForm } from "react-hook-form";
import { useAuth } from "../../components/AuthCtx.jsx";
import { db } from "../../../api/firebase";
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import { onValue, ref } from "firebase/database";
import { addCard } from "../../../api/customer.js";
import {fetchAndActivate, getValue} from "firebase/remote-config";
import {remoteConfig} from "../../../api/firebase.js";
import CryptoJS from 'crypto-js';

function CustomerAddCard() {
    const { user } = useAuth();
    const {
        handleSubmit,
        register,
    } = useForm();

    const [state, setState] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: '',
        focus: '',
    });
    const [cards, setCards] = useState([]);

    const handleInputChange = (evt) => {
        const { name, value } = evt.target;
        console.log(name, value);
        setState((prev) => ({ ...prev, [name]: value }));
    }

    const handleInputFocus = (evt) => {
        setState((prev) => ({ ...prev, focus: evt.target.name }));
    }

    const decryptAES = (combined, key) => {
        const combinedWordArray = CryptoJS.enc.Base64.parse(combined);
        const iv = CryptoJS.lib.WordArray.create(combinedWordArray.words.slice(0, 4));
        const ciphertext = CryptoJS.lib.WordArray.create(combinedWordArray.words.slice(4));
    
        const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, CryptoJS.enc.Utf8.parse(key), {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    };    

    useEffect(() => {
        fetchAndActivate(remoteConfig)
            .then(() => {
                const private_key = getValue(remoteConfig, 'private_key').asString();
                const cardsRef = ref(db, `users/${user.uid}/cards`);
                onValue(cardsRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        let cardNumbers = [];
                        for (let key in data) {
                            let card = data[key];
                            card.number = decryptAES(card.number, private_key);
                            card.expiry = decryptAES(card.expiry, private_key);
                            card.name = decryptAES(card.name, private_key);
                            card.cvc = decryptAES(card.cvc, private_key);
                            cardNumbers.push(card.number);
                            console.log(card);
                        }
                        setCards(cardNumbers);
                    }
                });
            });
    }, [user]);

    const toast = useToast();

    const onSubmit = async (data) => {
        let cardData = {
            number: state.number,
            expiry: state.expiry,
            cvc: state.cvc,
            name: state.name,
            billing_address: data.billing_address,
        }

        if (cardData.number.length < 16 || cardData.number.length > 16) {
            toast({
                title: "Invalid Card Number",
                description: "Please enter a valid card number.",
                status: "error",
                position: "top",
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        if (cardData.name === "") {
            toast({
                title: "Invalid Name",
                description: "Name cannot be empty.",
                status: "error",
                position: "top",
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        if (cardData.billing_address === "") {
            toast({
                title: "Invalid Billing Address",
                description: "Please enter a valid expiry date.",
                status: "error",
                position: "top",
                duration: 9000,
                isClosable: true,                
            })
        }

        if (cardData.expiry.length < 4 || cardData.expiry.length > 4) {
            toast({
                title: "Invalid Expiry Date",
                description: "Please enter a valid expiry date.",
                status: "error",
                position: "top",
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        if (cardData.cvc.length < 3 || cardData.cvc.length > 3) {
            toast({
                title: "Invalid CVC",
                description: "Please enter a valid CVC.",
                status: "error",
                position: "top",
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        if (cards.includes(cardData.number)) {
            toast({
                title: "Card Already Exists",
                description: "This card is already added to your account.",
                status: "error",
                position: "top",
                duration: 9000,
                isClosable: true,
            });
            return;
        }

        try {
            await addCard(user.uid, cardData);
            toast({
                title: "Card Added",
                description: "Card has been successfully added.",
                status: "success",
                position: "top",
                duration: 9000,
                isClosable: true,
            });
            window.history.back();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "An error occurred while adding the card.",
                status: "error",
                position: "top",
                duration: 9000,
                isClosable: true,
            });
        }
    }

    return (
        <Flex w="full" h="full" px={8} py={4} bg="#f4f4f4" direction="column">
            <Flex w="full" direction="row" alignItems="center" justifyContent="space-between">
                <Flex w="full" direction="row" alignItems="center" gap={4}>
                    <IoMdArrowRoundBack size="40px" onClick={() => window.history.back()}/>
                    <Text fontSize="2xl" fontWeight="700" color="#d69511">Add New Credit/Debit Card</Text>  
                </Flex>
                <Button colorScheme="blue" size="md" variant="solid" onClick={handleSubmit(onSubmit)}>Confirm & Submit</Button>
            </Flex> 
            <Flex w="full" h="full" direction="column" position="relative" alignItems="center" gap={4}>
                <Box position="absolute" zIndex={99}>
                    <Cards  
                        number={state.number}
                        expiry={state.expiry}
                        cvc={state.cvc}
                        name={state.name}
                        focused={state.focus}
                    />                            
                </Box>
                <Flex w="30rem" h="29rem" direction="column" bg="white" rounded="md" shadow="lg" px={6} py={20} position="absolute" top={24}>
                    <form action="/api/add-card" method="post">
                        <Flex w="full" direction="column" gap={4}>
                            <FormControl id="number">
                                <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                    Card Number
                                </FormLabel>
                                <InputGroup>
                                    <InputLeftAddon>
                                        <Text fontSize="md" fontWeight="600" color="gray.600"><CiCreditCard1 /></Text>
                                    </InputLeftAddon>
                                    <Input 
                                        variant="filled"
                                        type="tel"
                                        id="number"
                                        name="number"
                                        value={state.number || ''}
                                        onChange={handleInputChange}
                                        onFocus={handleInputFocus}
                                        placeholder="Card Number"
                                        rounded="md"
                                        borderWidth="1px"
                                        borderColor="gray.300"
                                        color="gray.900"
                                        focusBorderColor="blue.500"
                                        w="full"
                                    />
                                </InputGroup>
                            </FormControl>
                            <FormControl id="name">
                                <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                    Name
                                </FormLabel>
                                <InputGroup>
                                    <InputLeftAddon>
                                        <Text fontSize="md" fontWeight="600" color="gray.600"><FaRegUser /></Text>
                                    </InputLeftAddon>
                                    <Input 
                                        variant="filled"
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={state.name || ''}
                                        onChange={handleInputChange}
                                        onFocus={handleInputFocus}
                                        placeholder="Your Name"
                                        rounded="md"
                                        borderWidth="1px"
                                        borderColor="gray.300"
                                        color="gray.900"
                                        focusBorderColor="blue.500"
                                        w="full"
                                    />
                                </InputGroup>
                            </FormControl>
                            <Flex w="full" direction="row" gap={4}>
                                <Flex w="70%">
                                    <FormControl id="expiry">
                                        <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                            Valid Thru
                                        </FormLabel>
                                        <InputGroup>
                                            <InputLeftAddon>
                                                <Text fontSize="md" fontWeight="600" color="gray.600"><MdDateRange /></Text>
                                            </InputLeftAddon>
                                            <Input 
                                                variant="filled"
                                                type="tel"
                                                id="expiry"
                                                name="expiry"
                                                value={state.expiry || ''}
                                                onChange={handleInputChange}
                                                onFocus={handleInputFocus}
                                                placeholder="Valid Thru (MM/YY)"
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                focusBorderColor="blue.500"
                                                w="full"
                                            />
                                        </InputGroup>
                                    </FormControl>
                                </Flex>
                                <Flex w="30%">
                                    <FormControl id="cvc">
                                        <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                            CVC
                                        </FormLabel>
                                        <InputGroup>
                                            <InputLeftAddon>
                                                <Text fontSize="md" fontWeight="600" color="gray.600"><MdOutlineSecurity /></Text>
                                            </InputLeftAddon>
                                            <Input 
                                                variant="filled"
                                                type="tel"
                                                id="cvc"
                                                name="cvc"
                                                value={state.cvc || ''}
                                                onChange={handleInputChange}
                                                onFocus={handleInputFocus}
                                                placeholder="CVC"
                                                rounded="md"
                                                borderWidth="1px"
                                                borderColor="gray.300"
                                                color="gray.900"
                                                focusBorderColor="blue.500"
                                                w="full"
                                            />
                                        </InputGroup>
                                    </FormControl>
                                </Flex>
                            </Flex>
                            <FormControl id="billing_address">
                                <FormLabel fontSize="sm" fontWeight="700" color="gray.500" letterSpacing="wide">
                                    Billing Address
                                </FormLabel>
                                <Textarea 
                                    variant="filled"
                                    type="text"
                                    id="billing_address"
                                    name="billing_address"
                                    {
                                        ...register("billing_address", {
                                            required: "Billing address cannot be empty"
                                        })
                                    }
                                    placeholder="Billing address associated with this card"
                                    rounded="md"
                                    borderWidth="1px"
                                    borderColor="gray.300"
                                    color="gray.900"
                                    focusBorderColor="blue.500"
                                    w="full"
                                />
                            </FormControl>
                        </Flex>
                    </form>
                </Flex>
            </Flex>
        </Flex>
    )
}

export default CustomerAddCard;