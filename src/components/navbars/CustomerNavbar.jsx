import { 
    Avatar, 
    Flex, 
    Link, 
    Menu, 
    MenuButton, 
    MenuDivider, 
    MenuItem, 
    MenuList, 
    Text, 
    Button,
	Badge,
} from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import { BiChevronDown } from "react-icons/bi";
import { logout } from "../../../api/auth.js";
import { useAuth } from "../AuthCtx.jsx";
import { IoHomeOutline, IoCartOutline } from "react-icons/io5";

const CustomerNavbar = () => {
	const { user } = useAuth();
	const location = useLocation();
	const currentPath = location.pathname;
	const handleLogout = () => {
		logout();
	};
	
	return (
		<Flex
			as="nav"
			align="top"
			padding="1rem"
			bg="white" 
			bgColor={"white"}
			zIndex="999"
			width="100%"
			justify="space-between" 
		>
			<Flex align="center">
				<Avatar
					size="md"
					src="\src\assets\images\Space_Sculpt_Logo_nobg.png"
				/> 
				<Text fontSize="xl" ml={2} fontWeight="700" color="#d69511">
					Space Sculpt
				</Text>
			</Flex>
			
			<Flex alignItems="center">
				<Link as={NavLink} color="gray.500" to="/" marginRight={6} _activeLink={{ color: "#d69511" }} _focus={{ boxShadow: "none" }} _hover={{  textDecoration: "none" }}>
					<Flex alignItems="center" gap={2}>
						<IoHomeOutline/> Home
					</Flex>
				</Link>
				<Link as={NavLink} color="gray.500" to="/cart" marginRight={6} _activeLink={{ color: "#d69511" }} _focus={{ boxShadow: "none" }} _hover={{ textDecoration: "none" }}>
				<Flex alignItems="center" gap={2} position="relative">
					<Badge
						colorScheme="red"
						borderRadius="full"
						fontSize="0.8em"
						position="absolute"
						top="-8px"
						right="-20px"
					>
						{Object.keys(user?.cart || {}).length}
					</Badge>
					<IoCartOutline />
					Cart
				</Flex>
				</Link>
				<Menu marginRight={6}>
					<MenuButton as={Link} color="teal.500" display="flex" alignItems="center">
						<Flex alignItems="center">
							<MenuButton
								as={Button}
								rounded={'full'}
								variant={'link'}
								cursor={'pointer'}
								minW={0}>
								<Avatar
								size={'sm'}
								src="\src\assets\images\Default_User_Profile_2.png"
							/>
							</MenuButton>
							<BiChevronDown />
						</Flex>
					</MenuButton>
					
					<MenuList>
						<MenuItem as={NavLink} to="/profile" _focus={{ boxShadow: "none" }}>
							Profile
						</MenuItem>
						<MenuDivider />
						<MenuItem as={NavLink} onClick={handleLogout} _focus={{ boxShadow: "none" }}>
							Sign out
						</MenuItem>
					</MenuList>
				</Menu>
			</Flex>
		</Flex>
	)
}

export default CustomerNavbar;