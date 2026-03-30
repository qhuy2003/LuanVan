import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './AdminDashboard.module.scss';
import UserMenu from '../../components/UserMenu/UserMenu';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AdminStatistics() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Năm hiện tại làm mặc định
  const currentYear = new Date().getFullYear();

  // State cho từng loại thống kê
  const [userYear, setUserYear] = useState(currentYear);
  const [orderYear, setOrderYear] = useState(currentYear);
  const [revenueYear, setRevenueYear] = useState(currentYear);

  const [userStats, setUserStats] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);

  // Danh sách năm (từ 2020 đến hiện tại)
  const years = [];
  for (let y = 2020; y <= currentYear; y++) {
    years.push(y);
  }

  const months = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

  // Hàm lấy màu cho từng tháng (dùng cho biểu đồ đơn hàng)
  const getMonthColor = (month) => {
    const colors = [
      '#ef5350', '#ab47bc', '#7e57c2', '#5c6bc0',
      '#42a5f5', '#29b6f6', '#26c6da', '#26a69a',
      '#66bb6a', '#9ccc65', '#ffca28', '#ffee58'
    ];
    return colors[(month - 1) % colors.length];
  };

  // Hàm gọi API thống kê theo năm
  const fetchStats = async (year, setter, setLoading) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://luanvan-production-4c74.up.railway.app/api/admin/stats?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setter(res.data);
    } catch (err) {
      console.error('Lỗi tải thống kê:', err);
      toast.error('Không tải được dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra quyền admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Chỉ admin mới truy cập được!');
      navigate('/login');
    }
  }, [user, navigate]);

  // Tải dữ liệu người dùng mới
  useEffect(() => {
    fetchStats(userYear, setUserStats, setLoadingUser);
  }, [userYear]);

  // Tải dữ liệu đơn hàng
  useEffect(() => {
    fetchStats(orderYear, setOrderStats, setLoadingOrder);
  }, [orderYear]);

  // Tải dữ liệu doanh thu
  useEffect(() => {
    fetchStats(revenueYear, setRevenueStats, setLoadingRevenue);
  }, [revenueYear]);

  // Chuẩn bị dữ liệu cho biểu đồ
  const usersByMonth   = userStats?.users_by_month   || Array(12).fill(0);
  const ordersByMonth  = orderStats?.orders_by_month  || Array(12).fill(0);
  const revenueByMonth = revenueStats?.revenue_by_month || Array(12).fill(0);

  const maxUsers   = Math.max(...usersByMonth, 1);
  const maxOrders  = Math.max(...ordersByMonth, 1);

  // Cấu hình biểu đồ Doanh thu (Chart.js)
  const revenueChartData = {
    labels: months,
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: revenueByMonth,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Doanh thu theo tháng năm ${revenueYear}` },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => value.toLocaleString() + ' ₫',
        },
      },
    },
  };

  return (
  <div className={styles.dashboardContainer}>
    {/* Sidebar giữ nguyên */}
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
          <li onClick={() => navigate("/admin/orders")}>📦 Quản lý đơn hàng</li>
          <li onClick={() => navigate("/admin/statistics")}>📊 Thống kê</li>
        </ul>
      </nav>
    </aside>

    {/* Nội dung chính */}
    <main className={styles.content}>
      <header className={styles.headerBar}>
        <h1>Thống kê hệ thống</h1>
        <UserMenu />
      </header>

      {/* Các biểu đồ được tách riêng từng khối lớn */}
      <section className={styles.statisticsSection}>

        {/* 1. Người dùng mới */}
        <div className={styles.chartBlock}>
          <div className={styles.chartHeader}>
            <h3>👥 Người dùng mới theo tháng năm {userYear}</h3>
            <div className={styles.yearSelector}>
              <label>Năm:</label>
              <select
                value={userYear}
                onChange={(e) => setUserYear(Number(e.target.value))}
                className={styles.yearSelect}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingUser ? (
            <div className={styles.loading}>Đang tải dữ liệu người dùng...</div>
          ) : (
            <div className={styles.barChart} style={{ height: '450px' }}>
              {months.map((month, index) => (
                <div key={month} className={styles.barItem}>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${(usersByMonth[index] / maxUsers) * 380}px`, // tăng chiều cao tối đa
                      minHeight: '20px',
                    }}
                    title={`${usersByMonth[index]} người dùng mới`}
                  >
                    <span className={styles.barValue}>
                      {usersByMonth[index] > 0 ? usersByMonth[index] : ''}
                    </span>
                  </div>
                  <span className={styles.monthLabel}>{month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Số lượng đơn hàng */}
        <div className={styles.chartBlock}>
          <div className={styles.chartHeader}>
            <h3>📦 Số lượng đơn hàng theo tháng năm {orderYear}</h3>
            <div className={styles.yearSelector}>
              <label>Năm:</label>
              <select
                value={orderYear}
                onChange={(e) => setOrderYear(Number(e.target.value))}
                className={styles.yearSelect}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingOrder ? (
            <div className={styles.loading}>Đang tải dữ liệu đơn hàng...</div>
          ) : (
            <div className={styles.barChart} style={{ height: '450px' }}>
              {months.map((month, index) => (
                <div key={month} className={styles.barItem}>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${(ordersByMonth[index] / maxOrders) * 380}px`,
                      backgroundColor: getMonthColor(index + 1),
                      minHeight: '20px',
                    }}
                    title={`${month}: ${ordersByMonth[index]} đơn hàng`}
                  >
                    <span className={styles.barValue}>
                      {ordersByMonth[index] > 0 ? ordersByMonth[index] : ''}
                    </span>
                  </div>
                  <span className={styles.monthLabel}>{month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Doanh thu */}
        <div className={styles.chartBlock}>
          <div className={styles.chartHeader}>
            <h3>💰 Doanh thu theo tháng năm {revenueYear}</h3>
            <div className={styles.yearSelector}>
              <label>Năm:</label>
              <select
                value={revenueYear}
                onChange={(e) => setRevenueYear(Number(e.target.value))}
                className={styles.yearSelect}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingRevenue ? (
            <div className={styles.loading}>Đang tải dữ liệu doanh thu...</div>
          ) : (
            <div style={{ height: '500px', width: '100%', padding: '20px 0' }}>
              <Bar data={revenueChartData} options={revenueChartOptions} />
            </div>
          )}
        </div>

      </section>
    </main>
  </div>
);
}

export default AdminStatistics;


{/* <div className={styles.chartCard}>
              <h3>📦 Sản phẩm mới theo tháng</h3>
              <div className={styles.barChart}>
                {months.map((month, index) => (
                  <div key={month} className={styles.barItem}>
                    <div
                      className={styles.barProduct}
                      style={{ height: `${(stats.products_by_month[index] / maxProduct) * 240}px` }}
                    >
                      <span className={styles.barValue}>{stats.products_by_month[index]}</span>
                    </div>
                    <span className={styles.monthLabel}>{month}</span>
                  </div>
                ))}
              </div>
            </div> */}

              {/* //biểu đồ hình tròn */}
          {/* <div className={styles.chartCard}>
            <h3>👥 Người dùng mới theo tháng </h3>
            <div className={styles.pieChartContainer}>
              <div className={styles.pieChart}>
                <div 
                  className={styles.pieSlice}
                  style={{
                    background: `conic-gradient(
                      ${months.map((_, i) => {
                        const percent = cumulativePercent(i + 1);
                        const prevPercent = cumulativePercent(i);
                        const color = getMonthColor(i + 1);
                        return `${color} ${prevPercent}% ${percent}%, `;
                      }).join('')}
                      #f0f0f0 100%
                    )`
                  }}
                ></div>
                <div className={styles.pieCenter}>
                  <span className={styles.pieTotal}>{stats.total_users}</span>
                  <small>người dùng</small>
                </div>
              </div>

              <div className={styles.pieLegend}>
                {months.map((month, index) => {
                  const count = stats.users_by_month[index];
                  const percent = stats.total_users > 0 
                    ? ((count / stats.total_users) * 100).toFixed(1) 
                    : 0;
                  return count > 0 ? (
                    <div key={month} className={styles.legendItem}>
                      <span className={styles.legendColor} style={{ backgroundColor: getMonthColor(index + 1) }}></span>
                      <span>{month}: {count} người </span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div> */}
