import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../Products/Product.module.scss'; 
import { getBrandOrders, confirmOrder, rejectOrder } from '../../api/OrderApi';
import UserMenu from '../../components/UserMenu/UserMenu';

function BrandOrders() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await getBrandOrders();
      setOrders(res.orders || []);
    } catch (err) {
      toast.error('Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    const order = orders.find(o => o.order_id === orderId);

    let confirmMessage = 'Xác nhận xử lý đơn hàng này?';
    if (order.payment_method === 'bank_transfer') {
      confirmMessage = 'Đơn này thanh toán chuyển khoản. Bạn đã kiểm tra và NHẬN ĐỦ TIỀN chưa?\n\nBấm OK để xác nhận và giảm tồn kho.';
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      await confirmOrder(orderId);
      toast.success('Xác nhận đơn hàng thành công');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xác nhận thất bại');
    }
  };


  const handleReject = async (orderId) => {
    if (!window.confirm('Từ chối đơn hàng này? Hàng sẽ được hoàn lại kho.')) return;

    try {
      await rejectOrder(orderId);
      toast.success('Từ chối đơn hàng thành công');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Từ chối thất bại');
    }
  };

  const getStatusText = (status) => {
    const map = {
      pending: 'Chờ xử lý',
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


  if (loading) return <div className={styles.loading}>Đang tải đơn hàng...</div>;

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h2>Nhãn hàng</h2>
        </div>
        <nav>
          <ul>
            <li onClick={() => navigate('/brand/products')}>🛍️ Quản lý sản phẩm</li>
            <li onClick={() => navigate('/brand/categories')}>📁 Quản lý loại hàng hóa</li>
            <li onClick={() => navigate('/brand/promotions')}>🎫 Quản lý khuyến mãi</li>
            <li className={styles.active}>📦 Quản lý đơn hàng</li>
            <li onClick={() => navigate('/brand/statistics')}>📊 Thống kê </li>
          </ul>
        </nav>
      </aside>

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
            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Ngày đặt</th>
                  <th>Nhà bán lẻ</th>
                  <th>Tổng tiền</th>
                  <th>Phương thức thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles.emptyList}>Chưa có đơn hàng nào</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.order_id}>
                      <td>#{order.order_id}</td>
                      <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>{order.retailer?.store_name || 'N/A'}</td>
                      <td>{Number(order.total_amount).toLocaleString()} ₫</td>
                       <td>
                        {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 
                         order.payment_method === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : 
                         order.payment_method === 'vnpay' ? 'Thanh toán qua VNPAY' : 
                         order.payment_method === 'zalopay' ? 'Thanh toán qua ZaloPay' :""
                         }
                         
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td>
                      <div className={styles.actionGroup}>
                        {/* Chỉ hiện khi đơn đang pending */}
                        {order.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleConfirmOrder(order.order_id)}
                              className={styles.confirmButton}
                            >
                              Xác nhận 
                            </button>
                            <button 
                              onClick={() => handleReject(order.order_id)}
                              className={styles.rejectButton}
                            >
                              Từ chối
                            </button>
                          </>
                        )}

                        {/* Đã xử lý → không thao tác */}
                        {order.status !== 'pending' && (
                          <span className={styles.noAction}>—</span>
                        )}
                      </div>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BrandOrders;