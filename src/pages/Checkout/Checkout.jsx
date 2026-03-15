import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './Checkout.module.scss';
import { getCart, clearCartApi } from '../../api/CartApi';
import { createOrder } from '../../api/OrderApi';
import { getMyProfile, getBrandInfo } from '../../api/ProfileApi';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from '../../components/Layout/Layout';
import { SHIPPING_TYPES_CONFIG } from '../../config/shippingTypes';
import axios from 'axios';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TRACK_ASIA_KEY = "1fcda17688993175d2bb6ac1791bc2397b";

function Checkout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const warningTimeoutRef = useRef(null);
  const mapRef = useRef();
  
  // State
  const [cart, setCart] = useState([]);
  const [warehouseCoords, setWarehouseCoords] = useState(null);
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [distance, setDistance] = useState(null);
  const [shippingFee, setShippingFee] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentMethods] = useState([
    { 
      value: 'cod', 
      label: 'Thanh toán khi nhận hàng (COD)', 
      description: 'Trả tiền mặt khi nhận hàng',
      icon: '💵'
    },
    { 
      value: 'bank_transfer', 
      label: 'Chuyển khoản ngân hàng', 
      description: 'Chuyển khoản trước khi giao hàng',
      icon: '🏦'
    },
        {
      value: 'vnpay', 
      label: 'Thanh toán qua VNPAY', 
      description: 'Thanh toán qua cổng VNPAY (thẻ, QR)',
      icon: '💳'
    },
    { value: 'zalopay', 
      label: 'Thanh toán qua ZaloPay',
      description: 'Thanh toán nhanh bằng ví ZaloPay hoặc QR', 
      icon: '💚'
    }

  ]);

const [loadingVnpay, setLoadingVnpay] = useState(false);
const [loadingZaloPay, setLoadingZaloPay] = useState(false);
const handleVnpayPayment = async () => {
  const total = getTotal() + (shippingFee?.total || 0);

  // LƯU DỮ LIỆU TẠM TRƯỚC KHI CHUYỂN HƯỚNG
  localStorage.setItem('vnpay_checkout_items', JSON.stringify(cart));
  localStorage.setItem('vnpay_checkout_info', JSON.stringify({
    address: address,
    note: note,
    shipping_fee: shippingFee?.total || 0,
    distance: distance,
    discount_amount: getTotalDiscount() || 0
  }));

  try {
    setLoadingVnpay(true);
    const res = await axios.post('http://127.0.0.1:8000/api/payment/vnpay/create', {
      order_id: 'VNP_' + Date.now(),
      amount: total,
      order_info: `Thanh toan don hang logistics - CyanStore`
    });

    window.location.href = res.data.payment_url;
  } catch (err) {
    toast.error('Lỗi khởi tạo thanh toán VNPAY');
    setLoadingVnpay(false);
  }
};

const handleZaloPayPayment = async () => {
  const total = getTotal() + (shippingFee?.total || 0);

  // LƯU DỮ LIỆU TẠM TRƯỚC KHI CHUYỂN HƯỚNG
  localStorage.setItem('zalopay_checkout_items', JSON.stringify(cart));
  localStorage.setItem('zalopay_checkout_info', JSON.stringify({
    address: address,
    note: note,
    shipping_fee: shippingFee?.total || 0,
    distance: distance,
    discount_amount: getTotalDiscount() || 0
  }));

  try {
    setLoadingZaloPay(true);
    const res = await axios.post('http://127.0.0.1:8000/api/payment/zalopay/create', {
      order_id: 'ZLP_' + Date.now(),
      amount: total,
      order_info: `Thanh toan don hang logistics - QH`
    });

    window.location.href = res.data.payment_url;
  } catch (err) {
    toast.error('Lỗi khởi tạo thanh toán ZaloPay');
    setLoadingZaloPay(false);
  }
};
  const [vietqrUrl, setVietqrUrl] = useState('');
  const [generatingQR, setGeneratingQR] = useState(false);

// Hàm tạo VietQR động
const generateVietQR = () => {
  if (generatingQR || vietqrUrl) return;

  setGeneratingQR(true);

  const totalAmount = getTotal() + (shippingFee?.total || 0);
  const note = `Thanh toan don hang tu ${user.full_name || 'Retailer'} - QH`;

  const bankBin = '970415';
  const accountNumber = '1025837499';
  const accountName = 'CONG TY TNHH Logistics QH'; 

  const qrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?` +
    `amount=${totalAmount}` +
    `&addInfo=${encodeURIComponent(note)}` +
    `&accountName=${encodeURIComponent(accountName)}`;

  setVietqrUrl(qrUrl);
  setGeneratingQR(false);
};
  // Load cart from localStorage and fetch brand warehouse coordinates
  const loadCart = async () => {
    try {
      let selectedItems = [];
      try {
        selectedItems = JSON.parse(localStorage.getItem('checkout_items') || '[]');
      } catch (parseError) {
        console.error('Lỗi parse dữ liệu:', parseError);
        localStorage.removeItem('checkout_items');
        toast.error('Dữ liệu sản phẩm không hợp lệ!');
        navigate('/retailer/cart');
        return;
      }

      if (selectedItems.length === 0) {
        toast.error('Không có sản phẩm nào được chọn!');
        navigate('/retailer/cart');
        return;
      }

      const updatedItems = selectedItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price || item.original_price,
        original_price: item.original_price || item.price,
        quantity: item.quantity,
        weight_kg: item.weight_kg || 0,
        volume_m3: item.volume_m3 || 0,
        shipping_type_id: item.shipping_type_id || 1,
        vehicle_type: item.vehicle_type || 'xe_may',
        suggested_vehicle: item.suggested_vehicle || 'xe_may',
        image: item.image || item.image_url || '',
        brand_id: item.brand_id,
        brand_name: item.brand_name,
        brand_address: item.brand_address,
        applied_vouchers: item.applied_vouchers || {}
      }));

      setCart(updatedItems);
      
      // Fetch brand warehouse coordinates from brand of products
      try {
        // Get brand_id from first product in cart
        const brandId = updatedItems[0]?.brand_id;
        if (brandId) {
          const brandRes = await getBrandInfo(brandId);
          const brand = brandRes.data;
          
          if (brand.warehouse_lat && brand.warehouse_lng) {
            setWarehouseCoords({
              lat: parseFloat(brand.warehouse_lat),
              lng: parseFloat(brand.warehouse_lng)
            });
          } else {
            toast.warn('Brand chưa cập nhật địa chỉ kho hàng!');
          }
        } else {
          toast.warn('Không tìm thấy thông tin brand!');
        }
      } catch (err) {
        toast.error('Không thể tải tọa độ kho hàng');
      }
      
      setLoading(false);
      
    } catch (err) {
      toast.error('Lỗi tải dữ liệu thanh toán');
      navigate('/retailer/cart');
    }
  };

  // Calculate totals
  const getTotal = () => {
    const voucherInfo = JSON.parse(localStorage.getItem('checkout_voucher_info') || '{}');
    return voucherInfo.final_subtotal || 0;
  };

  const getOriginalTotal = () => {
    return cart.reduce((sum, item) => {
      return sum + ((item.original_price || item.price) * item.quantity);
    }, 0);
  };

  const getTotalDiscount = () => {
    return getOriginalTotal() - getTotal();
  };

  // Shipping calculation
const analyzeCartItems = (cartItems) => {
  const result = {
    totalWeight: 0,
    totalVolume: 0,
    requiredVehicle: 'xe_may', // Default xe máy
    hasXeMay: false,
    hasXeTai: false,
    hasDongLanh: false,
    hasDeVo: false,
    hasHangNang: false,
  };

  cartItems.forEach(item => {
    const weight = (item.weight_kg || 0) * item.quantity;
    const volume = (item.volume_m3 || 0) * item.quantity;
    
    result.totalWeight += weight;
    result.totalVolume += volume;
    
    // Lấy vehicle_type hoặc suggested_vehicle (ưu tiên suggested_vehicle nếu có)
    const vehicleType = item.suggested_vehicle || item.vehicle_type || 'xe_may';
    
    if (vehicleType === 'xe_tai') {
      result.hasXeTai = true;
      result.requiredVehicle = 'xe_tai'; // Ưu tiên xe tải nếu có item nào yêu cầu
    } else {
      result.hasXeMay = true;
    }
    
    if (item.shipping_type_id === 5) result.hasDongLanh = true;
    if (item.shipping_type_id === 3 || item.shipping_type_id === 6) result.hasDeVo = true;
    if (item.shipping_type_id === 2) result.hasHangNang = true;
  });

  // Nếu tổng trọng lượng > 50kg hoặc thể tích lớn → ép xe tải
  if (result.totalWeight > 50 || result.totalVolume > 0.24) {
    result.requiredVehicle = 'xe_tai';
  }

  return result;
};

const determineShippingTypeForOrder = (cartAnalysis) => {
  const { totalWeight, totalVolume, hasDongLanh, hasDeVo, hasHangNang, requiredVehicle } = cartAnalysis;
  
  let shippingTypeId;
  
  if (requiredVehicle === 'xe_tai') {
    if (hasDongLanh) {
      shippingTypeId = 5; // Đông lạnh xe tải
    } else if (hasDeVo) {
      shippingTypeId = 6; // Dễ vỡ xe tải
    } else {
      shippingTypeId = 4; // Thông thường xe tải
    }
  } else {
    if (hasHangNang) {
      shippingTypeId = 2; // Hàng nặng xe máy
    } else if (hasDeVo) {
      shippingTypeId = 3; // Dễ vỡ xe máy
    } else {
      shippingTypeId = 1; // Thông thường xe máy
    }
  }
  
  const config = SHIPPING_TYPES_CONFIG[shippingTypeId];
  
  if (!config) {
    toast.error('Lỗi cấu hình vận chuyển!');
    return null;
  }
  
  return {
    shipping_type_id: shippingTypeId,
    required_vehicle: requiredVehicle,
    config: config
  };
};
  const calculateShippingFee = (km) => {
    if (!km || cart.length === 0) return;
    
    const cartAnalysis = analyzeCartItems(cart);
    const shippingDecision = determineShippingTypeForOrder(cartAnalysis);
    
    if (!shippingDecision || !shippingDecision.config) {
      return;
    }
    
    const config = shippingDecision.config;
    let fee = 0;
    const breakdown = [];
    
    if (config.vehicle_type === 'xe_may') {
      if (km <= config.first_distance_km) {
        fee = config.first_distance_fee;
      } else {
        const extraKm = km - config.first_distance_km;
        const extraFee = Math.ceil(extraKm) * config.next_distance_fee;
        fee = config.first_distance_fee + extraFee;
      }
    } else {
      // Xe tải
      if (km <= 2) {
        fee = config.first_distance_fee;
      } else if (km <= 10) {
        const extraKm = km - 2;
        const extraFee = Math.ceil(extraKm) * config.distance_2_10_fee;
        fee = config.first_distance_fee + extraFee;
      } else {
        const km2to10 = 8;
        const kmOver10 = km - 10;
        const fee2to10 = km2to10 * config.distance_2_10_fee;
        const feeOver10 = Math.ceil(kmOver10) * config.distance_over_10_fee;
        fee = config.first_distance_fee + fee2to10 + feeOver10;
      }
    }
    
    // Phí trọng lượng
    if (cartAnalysis.totalWeight > config.base_weight_kg) {
      const extraWeight = cartAnalysis.totalWeight - config.base_weight_kg;
      const weightFee = Math.ceil(extraWeight) * config.extra_weight_fee;
      fee += weightFee;
    }
    
    // Phí thể tích (xe tải)
    if (config.vehicle_type === 'xe_tai' && config.base_volume_m3 > 0 && cartAnalysis.totalVolume > config.base_volume_m3) {
      const extraVolume = cartAnalysis.totalVolume - config.base_volume_m3;
      const volumeFee = Math.ceil(extraVolume) * config.extra_volume_fee;
      fee += volumeFee;
    }
    
    // Phụ phí đặc biệt
    if (config.special_fee > 0) {
      fee += config.special_fee;
    }
    
    // Làm tròn
    fee = Math.ceil(fee / 100) * 100;
        
    setShippingFee({
      total: fee,
      typeName: config.name,
      vehicle: config.vehicle_type,
      km: km.toFixed(1),
      breakdown: breakdown,
      cartAnalysis: cartAnalysis
    });
  };

  // Tim kiem dia chi
  const searchAddress = async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      return;
    }
    
    const url = `https://maps.track-asia.com/api/v2/place/textsearch/json?key=${TRACK_ASIA_KEY}&query=${encodeURIComponent(query)}&size=10`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.status === 'OK') {
        const tpHcmResults = data.results.filter(result => {
          const address = result.formatted_address || '';
          return address.toLowerCase().includes('tp.hcm') || 
                 address.toLowerCase().includes('hồ chí minh') ||
                 address.toLowerCase().includes('ho chi minh') ||
                 address.toLowerCase().includes('hcm');
        }).slice(0, 5);
        
        setSuggestions(tpHcmResults.map(r => ({
          label: r.formatted_address || r.name,
          lat: parseFloat(r.geometry.location.lat),
          lng: parseFloat(r.geometry.location.lng)
        })));
        
        if (data.results.length > 0 && tpHcmResults.length === 0) {
          warningTimeoutRef.current = setTimeout(() => {
            toast.info('Chỉ hỗ trợ giao hàng trong khu vực TP.HCM', {
              toastId: 'tphcm-warning', 
              autoClose: 3000
            });
          }, 1000);
        }
      }
    } catch (err) { 
      setSuggestions([]);
    }
  };

  const selectAddress = async (place) => {
    setAddress(place.label);
    setSuggestions([]);
    try {
      const url = `https://maps.track-asia.com/route/v2/directions/json?key=${TRACK_ASIA_KEY}&origin=${warehouseCoords.lat},${warehouseCoords.lng}&destination=${place.lat},${place.lng}&mode=driving`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const km = route.legs[0].distance.value / 1000;
        const coords = route.legs[0].steps.flatMap(step => [
          [step.start_location.lat, step.start_location.lng],
          [step.end_location.lat, step.end_location.lng]
        ]);
        
        setDistance(km);
        setRouteCoords(coords);
        calculateShippingFee(km);
        
        if (mapRef.current) {
          mapRef.current.fitBounds(L.latLngBounds(coords), { padding: [30, 30] });
        }
        
        toast.success(`Đã tìm thấy đường đi: ${km.toFixed(1)} km`);
      } else {
        toast.error('Không tìm thấy đường đi!');
      }
    } catch (err) { 
      console.error('Lỗi tính đường đi:', err);
      toast.error('Lỗi tính đường đi');
    }
  };

   
  const handleOrder = async () => {
    if (!address || !shippingFee) {
      toast.error('Vui lòng chọn địa chỉ giao hàng!');
      return;
    }
    
    try {
      const payload = {
        shipping_address: address,
        note,
        shipping_fee: shippingFee.total,
        distance_km: distance,
        payment_method: paymentMethod,
        items: cart.map(i => ({ 
          product_id: i.product_id, 
          quantity: i.quantity, 
          unit_price: i.price 
        }))
      };
      
      await createOrder(payload);
      await clearCartApi();
      localStorage.removeItem('checkout_items');
      
      const successMessage = paymentMethod === 'cod' 
        ? 'Đặt hàng thành công! Vui lòng chuẩn bị tiền mặt khi nhận hàng.'
        : 'Đặt hàng thành công! Vui lòng thanh toán để hoàn tất đơn hàng.';
      
      toast.success(successMessage);
      navigate('/retailer/orders');
    } catch (err) { 
      console.error('Lỗi đặt hàng:', err);
      toast.error('Đặt hàng thất bại: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  // Effects
  useEffect(() => {
    if (!user || user.role !== 'retailer') {
      toast.error('Vui lòng đăng nhập với tư cách Nhà bán lẻ!');
      navigate('/login');
      return;
    }
    loadCart();
    
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [navigate]);

  // lấyy lại bản đồ khi tọa độ kho thay đổi
  useEffect(() => {
    if (mapRef.current && warehouseCoords?.lat && warehouseCoords?.lng) {
      mapRef.current.setView([warehouseCoords.lat, warehouseCoords.lng], 13);
    }
  }, [warehouseCoords]);

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <Layout showSearch={false}>
      <div className={styles.checkoutWrapper}>
        <main className={styles.container}>
          {/* Left Column - Address & Payment */}
          <div className={styles.mainContent}>
            {/* Address Section */}
            <section className={styles.card}>
              {/* <h2 className={styles.cardTitle}>🏭 Điểm lấy hàng (Kho của nhãn hàng)</h2>
  <div className={styles.warehouseInfo}>
    <p><strong>Nhãn hàng:</strong> {cart[0]?.brand_name || 'Đang tải...'}</p>
    <p><strong>Địa chỉ kho:</strong> {cart[0]?.brand_address || 'Chưa có địa chỉ'}</p>
  </div> */}
              <h2 className={styles.cardTitle}>Địa chỉ giao hàng</h2>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  value={address}
                  onChange={e => { 
                    setAddress(e.target.value); 
                    searchAddress(e.target.value); 
                  }}
                  placeholder="Nhập địa chỉ giao hàng tại TP.HCM..."
                  className={styles.addressInput}
                />
                {suggestions.length > 0 && (
                  <ul className={styles.suggestions}>
                    {suggestions.map((s, i) => (
                      <li key={i} onClick={() => selectAddress(s)}>
                        {s.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.mapContainer}>
                {warehouseCoords && warehouseCoords.lat && warehouseCoords.lng ? (
                <MapContainer 
                  ref={mapRef} 
                  center={[warehouseCoords.lat, warehouseCoords.lng]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <Marker position={[warehouseCoords.lat, warehouseCoords.lng]}>
                    <Popup>Kho hàng: {cart[0]?.brand_name || 'Kho chính'}</Popup>
                  </Marker>
                  {routeCoords.length > 0 && (
                    <>
                      <Marker position={routeCoords[routeCoords.length - 1]}>
                        <Popup>Điểm giao hàng</Popup>
                      </Marker>
                      <Polyline positions={routeCoords} color="#00bcd4" weight={5} />
                    </>
                  )}
                </MapContainer>
                ) : (
                  <div style={{
                    height: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    color: '#999'
                  }}>
                    <p>⚠️ Brand chưa cập nhật địa chỉ kho hàng. Vui lòng thử lại sau.</p>
                  </div>
                )}
              </div>
              
              {shippingFee && (
                <div className={styles.shippingInfo}>
                  <span className={styles.infoItem}>
                    📍 Khoảng cách: <strong>{shippingFee.km} km</strong>
                  </span>
                  <span className={styles.infoItem}>
                    🚚 Loại vận chuyển: <strong>{shippingFee.typeName}</strong>
                  </span>
                </div>
              )}
            </section>

            {/* Payment Method Section */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Phương thức thanh toán</h2>
              
              <div className={styles.paymentMethods}>
                {paymentMethods.map(method => (
                 <div 
                      key={method.value}
                      className={`${styles.paymentMethod} ${paymentMethod === method.value ? styles.selected : ''}`}
                      onClick={() => {
                        setPaymentMethod(method.value);
                        if (method.value === 'bank_transfer') {
                          generateVietQR();
                        } else {
                          setVietqrUrl('');
                        }
                      }}
                    >
                    <div className={styles.methodRadio}>
                      <div className={styles.radioCircle}>
                        {paymentMethod === method.value && (
                          <div className={styles.radioInner} />
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.methodInfo}>
                      <div className={styles.methodName}>
                        {method.label}
                      </div>
                      <div className={styles.methodDesc}>
                        {method.description}
                      </div>
                    </div>
                    
                    <div className={styles.methodIcon}>
                      {method.icon}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Payment Notes */}
              {paymentMethod === 'cod' && (
                <div className={styles.paymentNote}>
                  <p><strong>📦 Lưu ý khi thanh toán COD:</strong></p>
                  <ul>
                    <li>Chuẩn bị đúng số tiền theo hóa đơn</li>
                    <li>Kiểm tra hàng trước khi thanh toán</li>
                    <li>Không có phí thu hộ COD</li>
                  </ul>
                </div>
              )}
              
              {paymentMethod === 'bank_transfer' && (
                  <div className={styles.paymentNote}>
                    <h3 className={styles.qrTitle}>🏦 Thanh toán qua VietQR</h3>

                    {generatingQR ? (
                      <div className={styles.qrLoading}>
                        <div className={styles.spinner}></div>
                        <p>Đang tạo mã QR...</p>
                      </div>
                    ) : vietqrUrl ? (
                      <div className={styles.vietqrSection}>
                        <div className={styles.qrWrapper}>
                          <img 
                            src={vietqrUrl} 
                            alt="Mã VietQR thanh toán" 
                            className={styles.qrImage}
                          />
                        </div>

                        <div className={styles.bankDetails}>
                          <p><strong>Ngân hàng:</strong> Vietcombank</p>
                          <p><strong>Chủ tài khoản:</strong> Nguyễn Quốc Huy</p>
                          <p><strong>Số tài khoản:</strong> 1025837499</p>
                          <p><strong>Số tiền chuyển:</strong> <span className={styles.amount}>{(getTotal() + (shippingFee?.total || 0)).toLocaleString()}đ</span></p>
                          <p><strong>Nội dung:</strong> <span className={styles.note}>Thanh toan don hang tu {user.full_name || 'Retailer'} </span></p>
                        </div>

                        <div className={styles.qrGuide}>
                          <p>👆 Mở app ngân hàng (MB, Vietcombank, BIDV...) → Quét mã QR → Thanh toán đúng số tiền và nội dung</p>
                          <p>⚠️   Vui lòng chuyển khoản đúng số tiền và nội dung.</p>
      <strong>Brand sẽ xác nhận khi nhận tiền → đơn hàng mới được xử lý.</strong>
                        </div>
                      </div>
                    ) : (
                      <p className={styles.qrPlaceholder}>Chọn phương thức này để hiển thị mã QR</p>
                    )}
                  </div>
                )}
            </section>
          </div>

          {/* Right Column - Order Summary */}
          <aside className={styles.sidebar}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Sản phẩm ({cart.length})</h2>
              
              <div className={styles.productList}>
                {cart.map(item => (
                  <div key={item.product_id} className={styles.productItem}>
                    <img 
                      src={item.image || item.image_url || 'https://via.placeholder.com/500?text=No+Image'} 
                      alt={item.product_name}
                      className={styles.productImage}
                    />
                    <div className={styles.pInfo}>
                      <h4 className={styles.productName}>{item.product_name}</h4>
                      <span className={styles.productQty}>
                        SL: {item.quantity} × {Math.round(item.price).toLocaleString()}đ
                      </span>
                    </div>
                    <div className={styles.pPrice}>
                      {Math.round(item.price * item.quantity).toLocaleString()}đ
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className={styles.summary}>
                <div className={styles.summaryHeader}>Tóm tắt đơn hàng</div>
                
                {getTotalDiscount() > 0 && (
                  <>
                    <div className={styles.row}>
                      <span>Tiền hàng (gốc)</span>
                      <span className={styles.originalPrice}>
                        {getOriginalTotal().toLocaleString()}đ
                      </span>
                    </div>
                    <div className={`${styles.row} ${styles.discount}`}>
                      <span>Giảm giá voucher</span>
                      <span>-{getTotalDiscount().toLocaleString()}đ</span>
                    </div>
                  </>
                )}
                
                <div className={styles.row}>
                  <span>Tiền hàng{getTotalDiscount() > 0 ? ' (sau giảm)' : ''}</span>
                  <span>{getTotal().toLocaleString()}đ</span>
                </div>
                
                <div className={styles.row}>
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee ? `${shippingFee.total.toLocaleString()}đ` : '--'}</span>
                </div>
                
                <div className={styles.row}>
                  <span>Phương thức thanh toán</span>
                  <span className={styles.paymentBadge}>
                    {paymentMethod === 'cod' && '💵 COD'}
                    {paymentMethod === 'bank_transfer' && '🏦 Chuyển khoản'}
                    {paymentMethod === 'zalopay' && '💜 zaolopay'}
                    {paymentMethod === 'vnpay' && '💳 VNPAY'}
                  
  
                  </span>
                </div>
                
                <div className={`${styles.row} ${styles.total}`}>
                  <span>Tổng thanh toán</span>
                  <span className={styles.finalPrice}>
                    {(getTotal() + (shippingFee?.total || 0)).toLocaleString()}đ
                  </span>
                </div>
              </div>

              {/* Confirm Button */}
           <button 
  onClick={() => {
    if (paymentMethod === 'vnpay') {
      handleVnpayPayment();
    }else if (paymentMethod === 'zalopay') {
      handleZaloPayPayment(); 
    } 
    else {
      handleOrder();
    }
  }}
  disabled={!address || !shippingFee || loadingVnpay||loadingZaloPay}
  className={styles.confirmBtn}
>
  {loadingVnpay ? 'Đang chuyển sang VNPAY...' :
   paymentMethod === 'vnpay' ? 'ĐẶT HÀNG & THANH TOÁN VNPAY' :
   paymentMethod === 'zalopay' ? 'ĐẶT HÀNG & THANH TOÁN ZALOPAY' :
   paymentMethod === 'bank_transfer' ? 'ĐẶT HÀNG & THANH TOÁN CHUYỂN KHOẢN' :
   'XÁC NHẬN ĐẶT HÀNG'
  }
</button>
            </section>
          </aside>
        </main>
      </div>
    </Layout>
  );
}

export default Checkout;