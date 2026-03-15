import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminDashboard.module.scss";
import { useEffect, useState } from "react";
import { getUserCount } from "../../api/UserApi";
import { getProductCount } from "../../api/ProductApi";

import { toast } from "react-toastify";
import UserMenu from "../../components/UserMenu/UserMenu";
function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const isBrand = user?.role === 'brand';


  const [userCount, setUserCount] = useState(null);
  const [productCount, setProductCount] = useState(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [users, products] = await Promise.all([
          getUserCount(),
          getProductCount()
        ]);
        setUserCount(users);
        setProductCount(products);
      } catch (err) {
        console.error("Failed to fetch counts:", err);
        toast.error("Không thể tải dữ liệu thống kê", {
          position: "top-right",
          autoClose: 3000
        });
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h2>Admin</h2>
        </div>
        <nav>
          <ul>
            <li onClick={() => navigate("/admin/users")}>👤 Quản lý người dùng</li>
            <li onClick={() => navigate("/admin/products")}>🛍️ Quản lý sản phẩm</li>
            <li onClick={() => navigate("/admin/categories")}>📁 Quản lý loại hàng hóa</li>
            <li onClick={() => navigate("/admin/promotions")}>🎫 Quản lý khuyến mãi</li>       
            <li onClick={() => navigate("/admin/orders")}> 📦 Quản lý Đơn hàng </li>
            <li onClick={() => navigate("/admin/statistics")}>📊 Thống kê </li>
          </ul>
        </nav>
      
      </aside>

      <main className={styles.content}>
        <header className={styles.headerBar}>
          <h1>Welcome, {user?.name || "Admin"}</h1>
           <UserMenu />
        </header>

        <section className={styles.metrics}>
          <div className={styles.card}>
            <h3>Users</h3>
            <p className={styles.value}>{userCount === null ? "..." : userCount}</p>
          </div>
          <div className={styles.card}>
            <h3>Products</h3>
            <p className={styles.value}>{productCount === null ? "..." : productCount}</p>
          </div>
          {/* <div className={styles.card}>
            <h3>Orders</h3>
            <p className={styles.value}>—</p>
          </div> */}
        </section>

        <section className={styles.mainContent}>
          <p>This is the admin dashboard. Add widgets or tables here.</p>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
