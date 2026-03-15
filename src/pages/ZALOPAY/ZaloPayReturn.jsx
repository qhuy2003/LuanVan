import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import styles from './ZaloPayReturn.module.scss';

function ZaloPayReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const status = params.get('status'); // ZaloPay trả status=1 nếu thành công
  const orderId = params.get('order_id'); // order_id bạn gửi trước đó

  const [processing, setProcessing] = useState(true);
  const [statusType, setStatusType] = useState('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const hasProcessedRef = useRef(false); // Guard ref để prevent double call

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const processZaloPayReturn = async () => {
      if (status !== '1') {
        setStatusType('failed');
        toast.error('Thanh toán ZaloPay thất bại hoặc bị hủy');
        setTimeout(() => navigate('/retailer/checkout'), 5000);
        setProcessing(false);
        return;
      }

      try {
        // Lấy dữ liệu tạm từ localStorage
        const checkoutItems = JSON.parse(localStorage.getItem('zalopay_checkout_items') || '[]');
        const checkoutInfo = JSON.parse(localStorage.getItem('zalopay_checkout_info') || '{}');

        if (checkoutItems.length === 0) {
          throw new Error('Không tìm thấy thông tin đơn hàng');
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Không tìm thấy token xác thực');
        }

        // Tạo payload để lưu đơn (Không gửi payment_status, backend tự tính)
        const payload = {
          shipping_address: checkoutInfo.address,
          note: checkoutInfo.note || '',
          shipping_fee: checkoutInfo.shipping_fee || 0,
          distance_km: checkoutInfo.distance || 0,
          discount_amount: checkoutInfo.discount_amount || 0,
          payment_method: 'zalopay',
          items: checkoutItems.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.price
          }))
        };

        // Gọi API tạo đơn hàng
        await axios.post('http://127.0.0.1:8000/api/orders', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Xóa dữ liệu tạm
        localStorage.removeItem('zalopay_checkout_items');
        localStorage.removeItem('zalopay_checkout_info');

        setStatusType('success');
        toast.success('🎉 Thanh toán ZaloPay thành công! Đơn hàng đã được lưu.');

        // Tự động chuyển về danh sách đơn hàng giống VNPAY
        setTimeout(() => navigate('/retailer/orders'), 3000);

      } catch (err) {
        setStatusType('failed');
        setErrorMsg(err.response?.data?.message || err.message || 'Lỗi hệ thống');
        toast.error(`Thanh toán thành công nhưng lưu đơn thất bại: ${err.response?.data?.message || 'Lỗi hệ thống'}`);
        setTimeout(() => navigate('/retailer/checkout'), 5000);
      } finally {
        setProcessing(false);
      }
    };

    processZaloPayReturn();
  }, []); // Empty dependency array - chỉ chạy 1 lần khi mount

  if (processing) {
    return <div className={styles.loading}>Đang xử lý thanh toán ZaloPay...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {statusType === 'success' ? (
          <>
            <div className={styles.successIcon}>✅</div>
            <h1>Thanh toán ZaloPay thành công!</h1>
            <p>Đơn hàng đã được lưu vào hệ thống.</p>
            <p className={styles.redirect}>Đang chuyển về danh sách đơn hàng trong 3 giây...</p>
          </>
        ) : (
          <>
            <div className={styles.failIcon}>❌</div>
            <h1>Thất bại</h1>
            <p>Lỗi: {errorMsg}</p>
            <p className={styles.redirect}>Đang chuyển về trang thanh toán trong 5 giây...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default ZaloPayReturn;