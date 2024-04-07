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
    Button 
} from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import { BiChevronDown } from "react-icons/bi";
import { logout } from "../../../api/auth.js";
import { useAuth } from "../AuthCtx.jsx";

const AdminNavbar = () => {
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
			shadow="md"
			justify="space-between" 
		>
			<Flex align="center">
				{/* <Avatar
					size="md"
					src="\src\assets\images\Call_A_Doctor_Logo_NoBg.png"
				/> */}
				<Text fontSize="xl" ml={2} fontWeight="bold">
					Space Sculpt
				</Text>
			</Flex>
			
			<Flex alignItems="center">
				<Link as={NavLink} color="teal.500" to="/" marginRight={6} _activeLink={{ color: "#0307fc" }} _focus={{ boxShadow: "none" }} _hover={{  textDecoration: "none" }}>
					Home
				</Link>
				{/* <Link as={NavLink} color="teal.500" to="/clinics" marginRight={6} _activeLink={{ color: "#0307fc" }} _focus={{ boxShadow: "none" }} _hover={{  textDecoration: "none" }}>
					Clinic List
				</Link>
				<Link as={NavLink} color="teal.500" to="/requests" marginRight={6} _activeLink={{ color: "#0307fc" }} _focus={{ boxShadow: "none" }} _hover={{  textDecoration: "none" }}>
					Appointment History
				</Link> */}
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
								src="\src\assets\images\Default_User_Profile.png"
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

export default AdminNavbar;