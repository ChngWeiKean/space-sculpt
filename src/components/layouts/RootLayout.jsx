import {Navigate, Outlet, useLocation, useNavigation} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {useAuth} from "../AuthCtx.jsx";
import LoadingBuffer from "../LoadingBuffer.jsx";
import {Box, Grid} from "@chakra-ui/react";
import AdminNavbar from "../navbars/AdminNavbar.jsx";
import CustomerNavbar from "../navbars/CustomerNavbar.jsx";
import LogisticsNavbar from "../navbars/LogisticsNavbar.jsx";

const RootLayout = () => {
	const {user, loading} = useAuth();
	const location = useLocation();
	const navigation = useNavigation();
	const [root, setRoot] = useState("/");
	
	console.log(location.pathname);
	
	useEffect(() => {
		console.log("RootLayout");
		console.log(user, loading);
	}, [user, loading]);
	
	return (
		<>
			{
				loading || navigation.state === "loading" ?
					<LoadingBuffer/> :
					(location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/forgot") ?
						!user ?
							<Box w="100%" h="100%" bg="#f4f4f4" overflow="auto" minH="100vh">
								<Outlet/>
							</Box> :
							(
								<Navigate to="/" />
							)
					:
						user ?
							<Box w="100%" h="100%" bg="#f4f4f4" overflow="auto" minH="100vh">
								<Grid templateRows="auto 1fr" w="100%" h="100%" bg="#f4f4f4" overflow="hidden">
									{
										user.role === "Customer" ?
											<CustomerNavbar/> :
											user.role === "Logistics" ?
												<LogisticsNavbar/> :
												user.role === "Admin" ?
													<AdminNavbar/> :
														<></>
									}
									<Box w="100%" h="100%" bg="#f4f4f4" overflow="auto">
										<Outlet/>
									</Box>
								</Grid>
							</Box> :
							(
								<Navigate to="/login" />
							)
			}
		</>
	)
}

export default RootLayout;