import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import BrandDashboard from "./pages/Brand/BrandDashboard";
import RetailerDashboard from "./pages/Retailer/RetailerDashboard";
import ShipperDashboard from "./pages/Shipper/ShipperDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import Promotions from "./pages/Promotions/Promotions";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Product from "./pages/Products/Product";
import Category from "./pages/Categories/Categories";
import Users from "./pages/Users/Users";
import Cart from "./pages/Cart/Cart";
import pr from "./pages/ProductDetail/ProductDetail";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import Profile from "./pages/Profile/Profile";  
import UserMenu from "./components/UserMenu/UserMenu"; 
import Checkout from "./pages/Checkout/Checkout"; 
import Orders from "./pages/Orders/Orders";
import AdminOrders from "./pages/Admin/AdminOrders";
import BrandOrders from "./pages/Brand/BrandOrders";
import RetailerOrders from "./pages/Retailer/RetailerOrders";
import AdminStatistics from "./pages/Admin/AdminStatistics";
import BrandStatistics from "./pages/Brand/BrandStatistics";
import VnpayReturn from "./pages/VNPAY/VNPayReturn";
import ZaloPayReturn from "./pages/ZALOPAY/ZaloPayReturn";
import AboutUs from "./pages/About us/AboutUs";
function App() {
  const user = JSON.parse(localStorage.getItem("user")); 

  return (
    <BrowserRouter>
          {/* Toastify */}
      <ToastContainer
        position="top-right"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      <Routes>
        {/* Trang chung */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      
        {/* Admin */}
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/products" element={<Product />} />
        <Route path="/admin/promotions" element={<Promotions />} />
        <Route path="/admin/categories" element={<Category />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders/>} /> 
        <Route path="/admin/statistics" element={<AdminStatistics/>} />
        {/* Brand */}
        <Route path="/brand/products" element={<Product />} />
        <Route path="/brand/dashboard" element={<BrandDashboard />} />
        <Route path="/brand/categories" element={<Category/>} />
        <Route path="/brand/promotions" element={<Promotions/>} />
        <Route path="/brand/orders" element={<BrandOrders/>} /> 
        <Route path="/brand/statistics" element={<BrandStatistics/>} />

        {/* Retailer & Shipper */}
        <Route path="/retailer/orders" element={<RetailerOrders/>} />
        <Route path="/retailer/dashboard" element={<RetailerDashboard />} />
        <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
        <Route path="/retailer/checkout" element={<Checkout />} />

        <Route path="/checkout/vnpay-return" element={<VnpayReturn />} />
        <Route path="/checkout/zalopay-return" element={<ZaloPayReturn />} />
        {/* user menu */}
        <Route path="/cart" element={<Cart/>} />
            <Route path="/productdetail/:id" element={<ProductDetail/>}/>
            <Route path="/profile" element={<Profile />} />
        {/* About Us */}
        <Route path="/about" element={<AboutUs />} />
        {/* Redirect tự động theo role */}
        <Route
          path="/products"
          element={
            user?.role === 'brand'
              ? <Navigate to="/brand/products" replace />
              : user?.role === 'admin'
              ? <Navigate to="/admin/products" replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>


    </BrowserRouter>
  );
}

export default App;
