import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import RootLayout from './components/layouts/RootLayout.jsx'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthCtx.jsx'
import './index.css'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import CustomerHome from './pages/customer/CustomerHome.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import LogisticsDashboard from './pages/logistics/LogisticsDashboard.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'

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
