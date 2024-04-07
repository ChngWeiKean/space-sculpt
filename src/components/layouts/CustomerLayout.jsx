import {Navigate, Outlet, useLocation, useNavigation} from "react-router-dom";
import React, {useEffect} from "react";
import {useAuth} from "../AuthCtx.jsx";

const CustomerLayout = () => {
	const {user, loading} = useAuth();
	const location = useLocation();
	const navigation = useNavigation();
	
	console.log(location.pathname);
	
	useEffect(() => {
		console.log("Customer Layout");
		console.log(user, loading);
	}, [user, loading]);
	
	return (
		<>
			{
				user.role !== "Customer" ?
					(
						<Navigate to="/" />
					) :
					(
						<Outlet/>
					)
			}
		</>
	)
}

export default CustomerLayout