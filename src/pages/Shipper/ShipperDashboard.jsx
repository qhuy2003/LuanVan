import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './ShipperDashboard.module.scss';
import UserMenu from '../../components/UserMenu/UserMenu';
import { 
  getShipperDashboard, 
  acceptOrder, 
  updateOrderStatus 
} from '../../api/ShipperApi'; 

function ShipperDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [availableOrders, setAvailableOrders] = useState([]);
  const [currentOrders, setCurrentOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role !== 'shipper') {
      toast.error('Chỉ shipper mới truy cập được!');
      navigate('/login');
      return;
    }

    loadDashboard();
  }, [navigate]);

  const loadDashboard = async () => {
    try {
      const res = await getShipperDashboard();
      // Chỉ hiển thị các đơn hàng đang ở trạng thái 'waiting_pickup'
      const available = (res.data.available_orders || []).filter(o => o.status === 'waiting_pickup');
      setAvailableOrders(available);
      setCurrentOrders(res.data.current_orders || []);
      setHistory(res.data.history || []);
    } catch (err) {
      toast.error('Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn nhận đơn này?')) return;

    try {
      await acceptOrder(orderId);
      toast.success('Nhận đơn thành công!');
      loadDashboard();
    } catch (err) {
      toast.error('Không thể nhận đơn');
    }
  };

  const handleUpdateStatus = async (orderId, status, note = '') => {
    const messages = {
      delivered: 'Xác nhận đã giao hàng thành công?',
      failed: 'Xác nhận giao hàng thất bại?'
    };

    if (!window.confirm(messages[status])) return;

    try {
      await updateOrderStatus(orderId, { status, note });
      toast.success(status === 'delivered' ? 'Giao hàng thành công!' : 'Đã ghi nhận thất bại');
      loadDashboard();
    } catch (err) {
      toast.error('Cập nhật thất bại');
    }
  };

  const formatPrice = (amount) => Number(amount).toLocaleString('vi-VN') + 'đ';

  const renderOrderCard = (order, type = 'available') => (
    <div key={order.order_id} className={styles.orderCard}>
      <div className={styles.orderHeader}>
        <h4>Mã đơn: #{order.order_id}</h4>
        <span className={`${styles.status} ${styles[order.status]}`}>
          {order.status === 'waiting_pickup' ? 'Chờ lấy hàng' : 
           order.status === 'shipping' ? 'Đang giao' : 
          order.status === 'delivered' ? 'Đã giao thành công' : 
         order.status === 'cancelled' ? 'Giao thất bại' : 'Khác'}
        </span>
      </div>

      <div className={styles.addressSection}>
        <div className={styles.pickup}>
          <strong>Điểm lấy hàng:</strong>
          <p>{order.brand?.warehouse_address  || 'Chưa có địa chỉ'}</p>
        </div>
        <div className={styles.delivery}>
          <strong>Điểm giao:</strong>
          <p>{order.shipping_address}</p>
        </div>
      </div>

          {order.items && order.items.length > 0 && (
        <div className={styles.productsList}>
          <strong>Danh sách sản phẩm:</strong>
          <div className={styles.productItems}>
            {order.items.map((item, idx) => {
              // Ưu tiên lấy ảnh đúng thứ tự (giống trang Retailer)
              const imageUrl = 
                item.product?.image_url || 
                item.image_url || 
                item.image || 
                null;

              const productName = 
                item.product?.product_name || 
                item.product_name || 
                'Sản phẩm';

              return (
                <div key={idx} className={styles.productItem}>
                  {/* Hình ảnh – giống hệt trang Retailer */}
                  <div className={styles.imageWrapper}>
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={productName}
                        className={styles.productImage}
    
                      />
                    ) : null}
                    {/* Placeholder nếu không có ảnh */}
                  </div>

                  {/* Thông tin */}
                  <div className={styles.productInfo}>
                    <p className={styles.productName}>{productName}</p>
                    <p className={styles.productDetails}>
                      Số lượng: <strong>x{item.quantity}</strong> | 
                      Giá: <strong>{Number(item.unit_price).toLocaleString()}₫</strong>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
       <div className={styles.itemsSummary}>
        <p><strong>Tổng số sản phẩm:</strong> {order.items?.reduce((total, item) => total + Number(item.quantity || 0), 0) || 0} món</p>
        <p><strong>Tổng tiền:</strong> {formatPrice(order.total_amount)}</p>
        <p><strong>Phí ship:</strong> {formatPrice(order.shipping_fee || 0)}</p>
      </div>

      <div className={styles.actionArea}>
      {order.status === 'waiting_pickup' && (
        <button 
          onClick={() => handleAcceptOrder(order.order_id)}
          className={styles.acceptBtn}
        >
          Nhận đơn
        </button>
      )}

      {order.status === 'shipping' && (
        <div className={styles.actionButtons}>
          <button 
            onClick={() => handleUpdateStatus(order.order_id, 'delivered')}
            className={styles.successBtn}
          >
            Đã giao thành công
          </button>
          <button 
            onClick={() => handleUpdateStatus(order.order_id, 'failed')}
            className={styles.failBtn}
          >
            Giao thất bại
          </button>
        </div>
      )}

      {/* Khi hoàn tất – không hiện nút, chỉ hiển thị trạng thái */}
      {/* {(order.status === 'delivered' || order.status === 'failed') && (
        <div className={styles.completedStatus}>
          <span className={order.status === 'delivered' ? styles.successText : styles.failText}>
            {order.status === 'delivered' ? 'Đơn đã hoàn tất ✓' : 'Giao hàng thất bại ✗'}
          </span>
          {order.note && <p className={styles.note}>Ghi chú: {order.note}</p>}
        </div>
      )} */}
    </div>
  </div>
);

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Dashboard Shipper</h1>
        <UserMenu />
      </header>

      <div className={styles.tabs}>
        <button 
          className={activeTab === 'available' ? styles.active : ''}
          onClick={() => setActiveTab('available')}
        >
          Đơn chờ nhận ({availableOrders.length})
        </button>
        <button 
          className={activeTab === 'current' ? styles.active : ''}
          onClick={() => setActiveTab('current')}
        >
          Đang giao ({currentOrders.length})
        </button>
        <button 
          className={activeTab === 'history' ? styles.active : ''}
          onClick={() => setActiveTab('history')}
        >
          Lịch sử
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'available' && (
          availableOrders.length === 0 ? 
            <p className={styles.empty}>Không có đơn hàng nào chờ nhận</p> :
            availableOrders.map(order => renderOrderCard(order, 'available'))
        )}

        {activeTab === 'current' && (
          currentOrders.length === 0 ? 
            <p className={styles.empty}>Bạn chưa nhận đơn nào</p> :
            currentOrders.map(order => renderOrderCard(order, 'current'))
        )}

        {activeTab === 'history' && (
          history.length === 0 ? 
            <p className={styles.empty}>Chưa có lịch sử giao hàng</p> :
            history.map(order => renderOrderCard(order))
        )}
      </div>
    </div>
  );
}

export default ShipperDashboard;