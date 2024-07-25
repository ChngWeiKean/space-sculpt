import {
	Text,
    Flex,
    Box,
    Button,
    Input,
    FormControl,
    FormLabel,
    Textarea,
    InputLeftAddon,
    useToast,
    InputGroup,
    Divider,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, memo, useCallback } from "react";
import { BsFillCloudArrowDownFill, BsPinMap } from "react-icons/bs";
import { RxCross1, RxHeight, RxWidth, RxSize, RxDimensions } from "react-icons/rx";
import { IoIosHeart, IoIosHeartEmpty, IoMdArrowRoundBack } from "react-icons/io";
import { IoBedOutline, IoCartOutline } from "react-icons/io5";
import { CiWarning } from "react-icons/ci";
import { GoSmiley } from "react-icons/go";
import { GrThreeD } from "react-icons/gr";
import { FaImage, FaRegFileImage } from "react-icons/fa6";
import { AiOutlineDash } from "react-icons/ai";
import { CiCreditCard1 } from "react-icons/ci";
import { FaPlus, FaTrash, FaStar, FaStarHalf, FaMinus } from "react-icons/fa6";
import { FaRegUser, FaGenderless } from "react-icons/fa";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { TbPasswordFingerprint, TbGenderMale, TbGenderFemale } from "react-icons/tb";
import { MdOutlineInventory, MdOutlineTexture, MdOutlineAlternateEmail, MdDateRange, MdOutlineSecurity } from "react-icons/md";
import { Form, useForm } from "react-hook-form";
import { NavLink, useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from "../../components/AuthCtx.jsx";
import { db } from "../../../api/firebase";
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import { onValue, ref, query, orderByChild, equalTo, set } from "firebase/database";
import { addCard, deleteCard, editCard } from "../../../api/customer.js";
import { encrypt, decrypt } from 'n-krypta'
import {fetchAndActivate, getValue} from "firebase/remote-config";
import {remoteConfig} from "../../../api/firebase.js";
import CryptoJS from 'crypto-js';

function CustomerEditCard() {
    const { user } = useAuth();
    const { id } = useParams();
    const {
        handleSubmit,
        register,
        setValue,
        formState: {
            errors, isSubmitting
        }
    } = useForm();

    const [state, setState] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: '',
        focus: '',
    });
    const [cards, setCards] = useState([]);
    const [ currentCard, setCurrentCard ] = useState({});
    const { isOpen, onOpen, onClose } = useDisclosure();

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
        console.log(combinedWordArray);
        const iv = CryptoJS.lib.WordArray.create(combinedWordArray.words.slice(0, 4));
        console.log(iv);
        const ciphertext = CryptoJS.lib.WordArray.create(combinedWordArray.words.slice(4));
        console.log(ciphertext);
    
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
                            if (key === id) {
                                let card = data[key];
                                card.number = decryptAES(card.number, private_key);
                                card.expiry = decryptAES(card.expiry, private_key);
                                card.name = decryptAES(card.name, private_key);
                                card.cvc = decryptAES(card.cvc, private_key);
                                card.billing_address = decryptAES(card.billing_address, private_key);
                                setCurrentCard(card);
                                setState({
                                    number: card.number,
                                    expiry: card.expiry,
                                    cvc: card.cvc,
                                    name: card.name,
                                    focus: '',
                                });
                            } else {
                                let card = data[key];
                                card.number = decryptAES(card.number, private_key);
                                card.expiry = decryptAES(card.expiry, private_key);
                                card.name = decryptAES(card.name, private_key);
                                card.cvc = decryptAES(card.cvc, private_key);
                                card.billing_address = decryptAES(card.billing_address, private_key);
                                cardNumbers.push(card.number);                                
                            }
                        }
                        setCards(cardNumbers);
                    }                        
                });
            });
    }, [user]);

    const toast = useToast();    

    const handleDelete = async () => {
        try {
            await deleteCard(user.uid, id);
            toast({
                title: "Card Deleted",
                description: "Card has been successfully deleted.",
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
                description: "An error occurred while deleting the card.",
                status: "error",
                position: "top",
                duration: 9000,
                isClosable: true,
            });
        }
    }

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
            await editCard(user.uid, id, cardData);
            toast({
                title: "Card Added",
                description: "Card has been successfully updated.",
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
                <Flex>
                    <Button colorScheme="blue" size="md" variant="solid" onClick={handleSubmit(onSubmit)}>Confirm & Submit</Button>
                    <Button colorScheme="red" size="md" variant="solid" onClick={onOpen} gap={3} ml={5}>
                        <FaTrash /> Delete Card
                    </Button>                         
                </Flex>
     

                <Modal size='xl' isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay
                        bg='blackAlpha.300'
                    />
                    <ModalContent>
                        <ModalHeader>
                            <Text fontSize="lg" fontWeight="700" color="gray.600" letterSpacing="wide">Confirmation to Delete Card</Text>
                        </ModalHeader>
                        <ModalCloseButton _focus={{ boxShadow: 'none', outline: 'none' }} />
                        <Divider mb={2} borderWidth='1px' borderColor="blackAlpha.300" />
                        <ModalBody>
                            <Text fontSize="md" fontWeight="500" color="gray.600" letterSpacing="wide">
                                Are you sure you want to delete this card? This action cannot be undone.
                            </Text>
                        </ModalBody>
                        <ModalFooter>
                            <Button colorScheme="red" mr={3} onClick={handleDelete}>
                                Delete
                            </Button>
                            <Button colorScheme="blue" mr={3} onClick={onClose}>
                                Close
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>     
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
                                    defaultValue={currentCard.billing_address || ""}
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

export default CustomerEditCard;