import { useNavigate } from "react-router-dom";
import styles from './BrandDashboard.module.scss'; 
import React, { Profiler, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify'; 
import "react-toastify/dist/ReactToastify.css";
import UserMenu from '../../components/UserMenu/UserMenu';

function BrandDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
useEffect(() => {
  const userData = localStorage.getItem('user');
  if (!userData) {
    toast.error('Vui lòng đăng nhập!');
    navigate('/login');
    return;
  }

  const user = JSON.parse(userData);
  if (user.role !== 'brand') {
    toast.error('Chỉ nhãn hàng mới truy cập được!');
    navigate('/login');
    return;
  }
}, [navigate]); 

return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h2>Brand</h2>
        </div>
        <nav>
          <ul>
            <li onClick={() => navigate("/brand/products")}>🛍️ Quản lý sản phẩm</li>
            <li onClick={() => navigate("/brand/categories")}>📁 Quản lý loại hàng hóa</li>
            <li onClick={() => navigate("/brand/promotions")}>🎫 Quản lý khuyến mãi</li>       
            <li onClick={() => navigate("/brand/orders")}> 📦 Quản lý đơn hàng </li>
            <li onClick={() => navigate("/brand/statistics")}>📊 Thống kê </li>
          </ul>
        </nav>
      
      </aside>

      <main className={styles.content}>
        <header className={styles.headerBar}>
          <h1>Welcome, {user?.role || "Admin"}</h1>
          <UserMenu />
        </header>

        <section className={styles.metrics}>

        </section>

        <section className={styles.mainContent}>
          <p>This is the brand dashboard. Add widgets or tables here.</p>
        </section>
      </main>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default BrandDashboard;
