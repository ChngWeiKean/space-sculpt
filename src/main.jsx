import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import RootLayout from './components/layouts/RootLayout.jsx'
import CustomerLayout from './components/layouts/CustomerLayout.jsx'
import LogisticsLayout from './components/layouts/LogisticsLayout.jsx'
import AdminLayout from './components/layouts/AdminLayout.jsx'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthCtx.jsx'
import './index.css'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import CustomerHome from './pages/customer/CustomerHome.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import LogisticsDashboard from './pages/logistics/LogisticsDashboard.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import UserList from './pages/admin/UserList.jsx'
import AddCategory from './pages/admin/AddCategory.jsx'
import CategoryDetails from './pages/admin/CategoryDetails.jsx'
import EditCategory from './pages/admin/EditCategory.jsx'
import AddFurniture from './pages/admin/AddFurniture.jsx'
import EditFurniture from './pages/admin/EditFurniture.jsx'
import CustomerCategoryDetails from './pages/customer/CustomerCategoryDetails.jsx'
import CustomerFurnitureDetails from './pages/customer/CustomerFurnitureDetails.jsx'
import CustomerCart from './pages/customer/CustomerCart.jsx'
import CustomerCheckout from './pages/customer/CustomerCheckout.jsx'
import CustomerProfile from './pages/customer/CustomerProfile.jsx'
import CustomerAddAddress from './pages/customer/CustomerAddAddress.jsx'
import CustomerEditAddress from './pages/customer/CustomerEditAddress.jsx'
import CustomerAddCard from './pages/customer/CustomerAddCard.jsx'
import CustomerEditCard from './pages/customer/CustomerEditCard.jsx'
import AddUser from './pages/admin/AddUser.jsx'
import ViewUser from './pages/admin/ViewUser.jsx'
import LogisticsSettings from './pages/logistics/LogisticsSettings.jsx'
import Vouchers from './pages/admin/Vouchers.jsx'
import AddVoucher from './pages/admin/AddVoucher.jsx'
import EditVoucher from './pages/admin/EditVoucher.jsx'
import CustomerPaymentAndPlaceOrder from './pages/customer/CustomerPaymentAndPlaceOrder.jsx'
import CustomerOrderHistory from './pages/customer/CustomerOrderHistory.jsx'
import CustomerOrderDetails from './pages/customer/CustomerOrderDetails.jsx'
import LogisticsOrderHistory from './pages/logistics/LogisticsOrderHistory.jsx'
import LogisticsOrderDetails from './pages/logistics/LogisticsOrderDetails.jsx'
import AdminOrderHistory from './pages/admin/AdminOrderHistory.jsx'
import AdminOrderDetails from './pages/admin/AdminOrderDetails.jsx'
import CustomerVouchers from './pages/customer/CustomerVouchers.jsx'
import ViewProfile from './pages/logistics/ViewProfile.jsx'

const HomeElement = () => {
	const { user } = useAuth();
 
	switch (user.role) {
		case "Customer":
			return <CustomerHome />;
		case "Admin":
			return <AdminDashboard />;
		case "Logistics":
			return <LogisticsDashboard />;
	}
};

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route element={<RootLayout/>}>
			<Route path="/" element={<HomeElement/>}/>
			<Route path="login" element={<Login/>}/>
			<Route path="register" element={<Register/>}/>
			<Route path="forgot" element={<ForgotPassword/>}/>
			<Route element={<CustomerLayout/>}>
				<Route path="category/:id" element={<CustomerCategoryDetails/>}/>
				<Route path="furniture/:id/details" element={<CustomerFurnitureDetails/>}/>
				<Route path="cart" element={<CustomerCart/>}/>
				<Route path="cart/checkout" element={<CustomerCheckout/>}/>
				<Route path="cart/checkout/payment" element={<CustomerPaymentAndPlaceOrder/>}/>
				<Route path="profile" element={<CustomerProfile/>}/>
				<Route path="add-address" element={<CustomerAddAddress/>}/>
				<Route path="edit-address/:id" element={<CustomerEditAddress/>}/>
				<Route path="add-card" element={<CustomerAddCard/>}/>
				<Route path="edit-card/:id" element={<CustomerEditCard/>}/>
				<Route path="orders" element={<CustomerOrderHistory/>}/>
				<Route path="orders/:id" element={<CustomerOrderDetails/>}/>
				<Route path="vouchers" element={<CustomerVouchers/>}/>
			</Route>
			<Route element={<LogisticsLayout/>}>
				<Route path="manage-orders" element={<LogisticsOrderHistory/>}/>
				<Route path="order-details/:id" element={<LogisticsOrderDetails/>}/>
				<Route path="view/:id" element={<ViewProfile/>}/>
				<Route path="settings" element={<LogisticsSettings/>}/>
			</Route>
			<Route path='/admin' element={<AdminLayout/>}>
				<Route path="users" element={<UserList/>}/>
				<Route path="category/add" element={<AddCategory/>}/>
				<Route path="category/:id" element={<CategoryDetails/>}/>
				<Route path="category/:id/edit" element={<EditCategory/>}/>
				<Route path="subcategory/add-furniture/:id" element={<AddFurniture/>}/>
				<Route path="furniture/:id/edit" element={<EditFurniture/>}/>
				<Route path="users/add" element={<AddUser/>}/>
				<Route path="users/:id/view" element={<ViewUser/>}/>
				<Route path="vouchers" element={<Vouchers/>}/>
				<Route path="vouchers/add" element={<AddVoucher/>}/>
				<Route path="vouchers/:id/edit" element={<EditVoucher/>}/>
				<Route path="customer-orders" element={<AdminOrderHistory/>}/>
				<Route path="customer-order-details/:id" element={<AdminOrderDetails/>}/>
			</Route>
		</Route>
	)
);

const theme = extendTheme({
	fonts: {
		body: 'Poppins, sans-serif',
		heading: 'Poppins, sans-serif',
	},
	config: {
		initialColorMode: 'light',
		useSystemColorMode: false,
	},
	colors: {
		brand: {
			100: '#f7fafc',
			900: '#1a202c',
		},
	},
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <ChakraProvider theme={theme}>
        <AuthProvider>
            <RouterProvider router={router}>
                <App/>
            </RouterProvider>
        </AuthProvider>
    </ChakraProvider>
)
