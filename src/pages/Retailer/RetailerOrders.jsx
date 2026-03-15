// src/pages/Retailer/RetailerOrders.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './RetailerOrders.module.scss';
import UserMenu from '../../components/UserMenu/UserMenu';
import { getRetailerOrders, completeOrder, cancelOrder, refundOrder } from '../../api/OrderApi';

function RetailerOrders() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // Tab hiện tại

  const tabs = [
    { key: 'all', label: 'Tất cả', count: 0 },
    { key: 'pending', label: 'Chờ xác nhận', statuses: ['pending'], count: 0 },
    { key: 'confirmed', label: 'Đã xác nhận', statuses: ['confirmed', 'waiting_pickup'], count: 0 },
    { key: 'shipping', label: 'Đang giao', statuses: ['shipping'], count: 0 },
    { key: 'delivered', label: 'Đã giao', statuses: ['delivered'], count: 0 },
    { key: 'completed', label: 'Hoàn thành', statuses: ['completed'], count: 0 },
    { key: 'cancelled', label: 'Đã hủy', statuses: ['cancelled'], count: 0 },
  ];

  useEffect(() => {
    if (user.role !== 'retailer') {
      toast.error('Chỉ nhà bán lẻ mới truy cập được!');
      navigate('/login');
      return;
    }
    loadOrders();
  }, [navigate]);

  const loadOrders = async () => {
    try {
      const res = await getRetailerOrders();
      setOrders(res.data || []);
    } catch (err) {
      toast.error('Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Tính số lượng đơn hàng theo từng tab
  const getTabCounts = () => {
    return tabs.map(tab => {
      if (tab.key === 'all') {
        return { ...tab, count: orders.length };
      }
      const count = orders.filter(order => tab.statuses?.includes(order.status)).length;
      return { ...tab, count };
    });
  };

  // Lọc đơn hàng theo tab
  const getFilteredOrders = () => {
    if (activeTab === 'all') return orders;
    
    const currentTab = tabs.find(t => t.key === activeTab);
    return orders.filter(order => currentTab?.statuses?.includes(order.status));
  };

  const handleCompleteOrder = async (orderId) => {
    if (!window.confirm('Xác nhận đã nhận hàng và hoàn tất đơn?')) return;

    try {
      await completeOrder(orderId);
      toast.success('Đơn hàng đã hoàn tất!');
      loadOrders();
    } catch (err) {
      toast.error('Không thể hoàn tất đơn hàng');
    }
  };
const handleCancelOrder = async (order) => {
  const confirmMessage = order.payment_method === 'vnpay' 
    ? 'Bạn có chắc muốn hủy đơn? Tiền sẽ được hoàn về tài khoản VNPAY trong 3-5 ngày làm việc.'
    : 'Bạn có chắc muốn hủy đơn hàng này?';

  if (!window.confirm(confirmMessage)) return;

  try {
    if (order.payment_method === 'vnpay') {
      // Gọi refund API cho VNPAY
      await refundOrder(order.order_id);
      toast.success('Đơn hàng đã hủy và đang xử lý hoàn tiền VNPAY! Tiền sẽ về tài khoản trong 3-5 ngày.');
    } else {
      // Gọi cancel API thông thường
      await cancelOrder(order.order_id);
      toast.success('Đơn hàng đã được hủy thành công!');
    }
    loadOrders(); // Reload danh sách
  } catch (err) {
    console.error('Error:', err);
    toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng');
  }
};
  const formatPrice = (amount) => {
    const num = Number(amount);
    if (amount === null || amount === undefined || Number.isNaN(num)) return '0đ';
    return num.toLocaleString('vi-VN') + 'đ';
  };

  const getStatusText = (status) => {
    const map = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      waiting_pickup: 'Chờ lấy hàng',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return map[status] || status;
  };

  const getStatusIcon = (status) => {
    const map = {
      pending: '⏳',
      confirmed: '✅',
      waiting_pickup: '📦',
      shipping: '🚚',
      delivered: '🎉',
      completed: '✔️',
      cancelled: '❌'
    };
    return map[status] || '📋';
  };

  const filteredOrders = getFilteredOrders();
  const tabsWithCounts = getTabCounts();

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={() => navigate('/retailer/dashboard')} className={styles.backBtn}>
            ← Quay lại
          </button>
          <h1>📦 Đơn hàng của tôi</h1>
        </div>
        <UserMenu />
      </header>

      {/* Tab Navigation giống Shopee */}
      <div className={styles.tabContainer}>
        <div className={styles.tabNavigation}>
          {tabsWithCounts.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tabButton} ${activeTab === tab.key ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className={styles.tabLabel}>{tab.label}</span>
              {tab.count > 0 && <span className={styles.tabCount}>({tab.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      <div className={styles.orderContainer}>
        {filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <p className={styles.emptyText}>Chưa có đơn hàng nào</p>
            <button onClick={() => navigate('/retailer/dashboard')} className={styles.shopNowBtn}>
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <div className={styles.orderList}>
            {filteredOrders.map(order => (
              <div key={order.order_id} className={styles.orderCard}>
                {/* Order Header */}
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderId}>Mã đơn: #{order.order_id}</span>
                    <span className={styles.orderDate}>
                      {new Date(order.order_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className={`${styles.orderStatus} ${styles[order.status]}`}>
                    <span className={styles.statusIcon}>{getStatusIcon(order.status)}</span>
                    <span className={styles.statusText}>{getStatusText(order.status)}</span>
                  </div>
                </div>

                {/* Brand Info */}
                <div className={styles.brandInfo}>
                  <span className={styles.brandIcon}>🏭</span>
                  <span className={styles.brandName}>{order.brand?.brand_name || 'Nhãn hàng'}</span>
                </div>

                {/* Order Items */}
                <div className={styles.orderItems}>
                  {order.items?.map(item => (
                    <div key={item.order_item_id} className={styles.orderItem}>
                      <div className={styles.itemImage}>
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt={item.product.product_name} />
                        ) : (
                          <div className={styles.noImage}>📦</div>
                        )}
                      </div>
                      <div className={styles.itemInfo}>
                        <h4 className={styles.itemName}>{item.product?.product_name || 'Sản phẩm'}</h4>
                        <p className={styles.itemQuantity}>x{item.quantity}</p>
                      </div>
                      <div className={styles.itemPrice}>
                        {formatPrice(item.unit_price ?? item.price ?? item.original_price ?? item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className={styles.orderSummary}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Tổng tiền hàng:</span>
                    <span className={styles.summaryValue}>{formatPrice(order.total_amount - (order.shipping_fee || 0))}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Phí vận chuyển:</span>
                    <span className={styles.summaryValue}>{formatPrice(order.shipping_fee || 0)}</span>
                  </div>
                  <div className={`${styles.summaryRow} ${styles.total}`}>
                    <span className={styles.summaryLabel}>Tổng thanh toán:</span>
                    <span className={styles.totalAmount}>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.orderActions}>
                  {['pending', 'confirmed', 'waiting_pickup'].includes(order.status) && (
                    <button
                      onClick={() => handleCancelOrder(order)}
                      className={`${styles.actionBtn} ${styles.cancelBtn}`}
                    >
                      Hủy đơn
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <>
                      {/* <button
                        onClick={() => handleCancelOrder(order)}
                        className={`${styles.actionBtn} ${styles.secondaryBtn}`}
                      >
                        Hoàn hàng
                      </button> */}
                      <button
                        onClick={() => handleCompleteOrder(order.order_id)}
                        className={`${styles.actionBtn} ${styles.primaryBtn}`}
                      >
                        Đã nhận hàng
                      </button>
                    </>
                  )}

                  {order.status === 'completed' && (
                    <button
                      className={`${styles.actionBtn} ${styles.secondaryBtn}`}
                      onClick={() => navigate(`/orders/${order.order_id}`)}
                    >
                      Xem chi tiết
                    </button>
                  )}

             
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RetailerOrders;