import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './BrandDashBoard.module.scss';
import UserMenu from '../../components/UserMenu/UserMenu';

// Chart.js & react-chartjs-2
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

function BrandStatistics() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const currentYear = new Date().getFullYear();

  // State riêng cho từng biểu đồ
  const [productYear, setProductYear] = useState(currentYear);
  const [revenueYear, setRevenueYear] = useState(currentYear);
  const [orderYear, setOrderYear] = useState(currentYear);

  const [productStats, setProductStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [orderStats, setOrderStats] = useState(null);

  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(true);

  // Danh sách năm
  const years = [];
  for (let y = 2020; y <= currentYear; y++) {
    years.push(y);
  }

  const months = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

  const getMonthColor = (month) => {
    const colors = [
      '#ef5350', '#ab47bc', '#7e57c2', '#5c6bc0',
      '#42a5f5', '#29b6f6', '#26c6da', '#26a69a',
      '#66bb6a', '#9ccc65', '#ffca28', '#ffee58'
    ];
    return colors[(month - 1) % colors.length];
  };

  // Hàm gọi API thống kê theo năm
  const fetchBrandStats = async (year, setter, setLoading) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/brand/stats?year=${year}`, {
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

  // Kiểm tra quyền brand
  useEffect(() => {
    if (!user || user.role !== 'brand') {
      toast.error('Chỉ nhãn hàng mới truy cập được!');
      navigate('/login');
    }
  }, [user, navigate]);

  // Tải dữ liệu sản phẩm mới
  useEffect(() => {
    fetchBrandStats(productYear, setProductStats, setLoadingProduct);
  }, [productYear]);

  // Tải dữ liệu doanh thu
  useEffect(() => {
    fetchBrandStats(revenueYear, setRevenueStats, setLoadingRevenue);
  }, [revenueYear]);

  // Tải dữ liệu đơn hàng
  useEffect(() => {
    fetchBrandStats(orderYear, setOrderStats, setLoadingOrder);
  }, [orderYear]);

  // Chuẩn bị dữ liệu
  const productsByMonth = productStats?.products_by_month || Array(12).fill(0);
  const revenueByMonth  = revenueStats?.revenue_by_month  || Array(12).fill(0);
  const ordersByMonth   = orderStats?.orders_by_month   || Array(12).fill(0);

  const maxProduct = Math.max(...productsByMonth, 1);
  const maxRevenue = Math.max(...revenueByMonth, 1);
  const maxOrders  = Math.max(...ordersByMonth, 1);

  // Cấu hình biểu đồ Doanh thu (dùng Chart.js cho đẹp và chuyên nghiệp hơn)
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
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y.toLocaleString()} ₫`,
        },
      },
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
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h2>Nhãn hàng</h2>
        </div>
        <nav>
          <ul>
            <li onClick={() => navigate("/brand/products")}>🛍️ Quản lý sản phẩm</li>
            <li onClick={() => navigate("/brand/categories")}>📁 Quản lý loại hàng hóa</li>
            <li onClick={() => navigate("/brand/promotions")}>🎫 Quản lý khuyến mãi</li>
            <li onClick={() => navigate("/brand/orders")}>📦 Quản lý đơn hàng</li>
            <li onClick={() => navigate("/brand/statistics")}>📊 Thống kê</li>
          </ul>
        </nav>
      </aside>

      {/* Nội dung chính */}
      <main className={styles.content}>
        <header className={styles.headerBar}>
          <h1>Thống kê nhãn hàng</h1>
          <UserMenu />
        </header>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '60px', padding: '20px 0', maxWidth: '1400px', margin: '0 auto' }}>

          {/* 1. Sản phẩm mới */}
          <div className={styles.chartBlock}>
            <div className={styles.chartHeader}>
              <h3>📦 Sản phẩm mới theo tháng năm {productYear}</h3>
              <div className={styles.yearSelector}>
                <label>Năm:</label>
                <select
                  value={productYear}
                  onChange={(e) => setProductYear(Number(e.target.value))}
                  className={styles.yearSelect}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingProduct ? (
              <div className={styles.loading}>Đang tải dữ liệu sản phẩm...</div>
            ) : (
              <div className={styles.barChart} style={{ height: '450px' }}>
                {months.map((month, index) => (
                  <div key={month} className={styles.barItem}>
                    <div
                      className={styles.barProduct}
                      style={{
                        height: `${(productsByMonth[index] / maxProduct) * 380}px`,
                        minHeight: '20px',
                      }}
                      title={`${productsByMonth[index]} sản phẩm mới`}
                    >
                      <span className={styles.barValue}>
                        {productsByMonth[index] > 0 ? productsByMonth[index] : ''}
                      </span>
                    </div>
                    <span className={styles.monthLabel}>{month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

   
          {/* 3. Số lượng đơn hàng */}
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
                    <option key={y} value={y}>{y}</option>
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
                 {/* 2. Doanh thu (dùng Chart.js) */}
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
                    <option key={y} value={y}>{y}</option>
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

export default BrandStatistics;