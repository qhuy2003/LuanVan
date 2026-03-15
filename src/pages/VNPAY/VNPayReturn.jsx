// src/pages/VNPAY/VNPayReturn.jsx (hoặc file return của bạn)
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import styles from './VNPayReturn.module.scss';

function VNPayReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const processingRef = useRef(false); // Track để chỉ xử lý 1 lần

  const responseCode = params.get('vnp_ResponseCode');
  const txnRef = params.get('vnp_TxnRef');
  const amount = params.get('vnp_Amount');
  const transactionNo = params.get('vnp_TransactionNo');

  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'failed'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Ngăn chặn double call
    if (processingRef.current) {
      return;
    }
    processingRef.current = true;

    const handleVNPayReturn = async () => {
      // Nếu payment thất bại từ VNPAY
      if (responseCode !== '00') {
        setStatus('failed');
        setErrorMsg(responseCode || 'Unknown error');
        toast.error(`❌ Thanh toán thất bại. Mã lỗi: ${responseCode}`);
        setTimeout(() => navigate('/retailer/checkout'), 3000);
        return;
      }

      // Payment thành công từ VNPAY, giờ lưu vào DB
      try {
        const checkoutItems = JSON.parse(localStorage.getItem('vnpay_checkout_items') || '[]');
        const checkoutInfo = JSON.parse(localStorage.getItem('vnpay_checkout_info') || '{}');

        if (checkoutItems.length === 0) {
          setStatus('failed');
          setErrorMsg('No checkout items found');
          toast.error('Không tìm thấy thông tin đơn hàng!');
          setTimeout(() => navigate('/retailer/cart'), 2000);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setStatus('failed');
          setErrorMsg('Not authenticated');
          toast.error('Lỗi: Không tìm thấy token. Vui lòng đăng nhập lại!');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const payload = {
          shipping_address: checkoutInfo.address,
          note: checkoutInfo.note || '',
          shipping_fee: checkoutInfo.shipping_fee || 0,
          distance_km: checkoutInfo.distance || 0,
          payment_method: 'vnpay',
          vnp_txn_ref: txnRef,
          vnp_transaction_no: transactionNo,
          discount_amount: checkoutInfo.discount_amount || 0,
          items: checkoutItems.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.price
          }))
        };

        const response = await axios.post('http://127.0.0.1:8000/api/orders', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Xóa localStorage sau khi lưu thành công
        localStorage.removeItem('vnpay_checkout_items');
        localStorage.removeItem('vnpay_checkout_info');

        setStatus('success');
        toast.success('🎉 Thanh toán thành công và đơn hàng đã được lưu!');
        setTimeout(() => navigate('/retailer/orders'), 3000);

      } catch (err) {
        setStatus('failed');
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to save order');
        console.error('Lỗi lưu đơn:', err.response?.data || err.message);
        toast.error(`Thanh toán thành công nhưng lưu đơn thất bại: ${err.response?.data?.message || err.message}`);
        setTimeout(() => navigate('/retailer/dashboard'), 5000);
      }
    };

    handleVNPayReturn();
  }, [responseCode, navigate, txnRef, transactionNo]);

  if (status === 'processing') {
    return <div className={styles.loading}>Đang xử lý thanh toán...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === 'success' ? (
          <>
            <h1 style={{ color: '#28a745' }}>✅ Thanh toán thành công!</h1>
            <p>Đơn hàng đã được lưu vào hệ thống.</p>
            <p>Đang chuyển về danh sách đơn hàng...</p>
          </>
        ) : (
          <>
            <h1 style={{ color: '#dc3545' }}>❌ Thanh toán thất bại</h1>
            <p>Mã lỗi: {errorMsg}</p>
            <p>Đang chuyển về trang thanh toán...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default VNPayReturn;