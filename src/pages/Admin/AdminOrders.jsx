// src/pages/Admin/Orders/AdminOrders.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { toast } from 'react-toastify';
import { getAdminOrders, transferToWaitingPickup } from '../../api/OrderApi'; 
import styles from '../Products/Product.module.scss'; 
import UserMenu from '../../components/UserMenu/UserMenu';  
function AdminOrders() {
  const navigate = useNavigate(); 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await getAdminOrders();
      setOrders(res.orders || []);
      setLoading(false);
    } catch (err) {
      toast.error('Không tải được đơn hàng');
      setLoading(false);
    }
  };

  const handleTransfer = async (orderId) => {
    if (window.confirm('Chuyển đơn hàng này sang Chờ lấy hàng?')) {
      try {
        await transferToWaitingPickup(orderId);
        toast.success('Chuyển trạng thái thành công');
        loadOrders();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Thao tác thất bại');
      }
    }
  };

  const getStatusText = (status) => {
    const map = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      waiting_pickup: 'Chờ lấy hàng',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      completed: 'Hoàn tất',
      cancelled: 'Đã hủy'
    };
    return map[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      pending: styles.statusPending,
      confirmed: styles.statusConfirmed,
      waiting_pickup: styles.statusWaitingPickup,
      shipping: styles.statusShipping,
      delivered: styles.statusDelivered,
      completed: styles.statusCompleted,
      cancelled: styles.statusCancelled
    };
    return classMap[status] || '';
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h2>Admin</h2>
        </div>
        <nav>
          <ul>
            <li onClick={() => navigate('/admin/users')}>👤 Quản lý người dùng</li>
            <li onClick={() => navigate('/admin/products')}>🛍️ Quản lý sản phẩm</li>
            <li onClick={() => navigate('/admin/categories')}>📁 Quản lý loại hàng hóa</li>
           <li onClick={() => navigate("/admin/promotions")}>🎫 Quản lý khuyến mãi</li>       
            <li className={styles.active}>📦 Quản lý đơn hàng</li>
            <li onClick={() => navigate("/admin/statistics")}>📊 Thống kê </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.content}>
        <header className={styles.headerBar}>
          <h1>Quản lý đơn hàng</h1>
           <UserMenu />
        </header>

        <div className={styles.productPage}>
          <div className={styles.header}>
            <h1>Danh sách đơn hàng</h1>
          </div>

          <div className={styles.productList}>
            <table>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Ngày đặt</th>
                  <th>Nhà bán lẻ</th>
                  <th>Nhãn hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  {/* <th>Check</th> */}
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.order_id}>
                    <td>#{order.order_id}</td>
                    <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                    <td>{order.retailer?.store_name || 'N/A'}</td>
                    <td>{order.brand?.brand_name || 'N/A'}</td>
                    <td>{Number(order.total_amount).toLocaleString()} ₫</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    {/* <td className={styles.checkColumn}>
                      {order.status === 'waiting_pickup' && (
                        <span className={styles.checkTick}>✓</span>
                      )}
                    </td> */}
                    <td>
                      {order.status === 'confirmed' && (
                        <button 
                          className={styles.transferButton}
                          onClick={() => handleTransfer(order.order_id)}
                        >
                          Chuyển Chờ lấy hàng
                        </button>
                      )}
                      {order.status !== 'confirmed' && (
                        <span className={styles.noAction}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className={styles.emptyList}>Chưa có đơn hàng nào</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminOrders;