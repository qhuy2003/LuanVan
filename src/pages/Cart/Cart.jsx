import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './Cart.module.scss';
import { getCart, updateCartItemApi, removeFromCartApi } from '../../api/CartApi';
import { getPublicPromotions, applyVoucher,getBrandPromotions } from '../../api/PromotionApi'; // API thật của bạn
import UserMenu from '../../components/UserMenu/UserMenu';
import Layout from '../../components/Layout/Layout';


function Cart() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [appliedVoucherBrand, setAppliedVoucherBrand] = useState({});
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [availableVouchersBrand, setAvailableVouchersBrand] = useState({});
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [loadingVouchersBrand, setLoadingVouchersBrand] = useState(true);
  const [showVoucherListBrand, setShowVoucherListBrand] = useState({});

  useEffect(() => {
    if (!user || user.role !== 'retailer') {
      toast.error('Vui lòng đăng nhập với tư cách Nhà bán lẻ!');
      navigate('/login');
      return;
    }
    loadCart();
    loadAvailableVouchers(); 
  }, []);
useEffect(() => {
  if (cart.length === 0) return;

  const brandIds = [...new Set(cart.map(item => item.brand_id))]; // Lấy danh sách brand_id duy nhất

  brandIds.forEach(brandId => {
    if (brandId && !availableVouchersBrand[brandId]) {
      loadAvailableVouchersBrand(brandId);
    }
  });
}, [cart]); // Chạy lại mỗi khi cart thay đổi giỏ hàng
//validate
useEffect(() => {
    if (!appliedVoucher) return;
    
    const currentSubtotal = getSubTotal();
    
    // validate min_order_amount
    if (appliedVoucher.min_order_amount > 0 && currentSubtotal < appliedVoucher.min_order_amount) {
      setAppliedVoucher(null);
      toast.warning(`Mã khuyến mãi cần đơn hàng từ ${Number(appliedVoucher.min_order_amount).toLocaleString()}₫`);
    }
  }, [selectedItems]); // Re-check whenever selection changes

  const loadCart = async () => {
    try {
      const data = await getCart();
      const items = data.items || [];
      setCart(items);
      const selected = {};
      items.forEach(item => selected[item.product_id] = false);
      setSelectedItems(selected);
    } catch (err) {
      toast.error('Không tải được giỏ hàng');
    }
  };

  const getSelectedSubTotal = () => {
  return getSelectedItems().reduce((sum, i) => sum + i.price * i.quantity, 0);
};
  // LẤY KHUYẾN MÃI THẬT TỪ API /promotions
  const loadAvailableVouchers = async () => {
    setLoadingVouchers(true);
    try {
      const res = await getPublicPromotions(); // API trả { success: true, data: [...] }
      setAvailableVouchers(res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách khuyến mãi');
      setAvailableVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  };


 const loadAvailableVouchersBrand = async (brandId) => {
  if (!brandId) return;

  // Nếu đã load rồi → không load lại (tránh gọi API liên tục)
  if (availableVouchersBrand[brandId]) {
    return;
  }

  setLoadingVouchersBrand(true);
  try {
    const res = await getBrandPromotions(brandId);
    setAvailableVouchersBrand(prev => ({
      ...prev,
      [brandId]: res.data || []
    }));
  } catch (err) {
    toast.error('Không tải được mã của shop');
  } finally {
    setLoadingVouchersBrand(false);
  }
};
  // ÁP DỤNG MÃ GIẢM GIÁ 
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return toast.error('Vui lòng nhập mã');
    try {
      const res = await applyVoucher(voucherCode.toUpperCase(), getSelectedSubTotal()); 
      setAppliedVoucher(res.data);
      toast.success(`Áp dụng ${voucherCode.toUpperCase()} thành công!`);
      setVoucherCode('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã không hợp lệ hoặc không đủ điều kiện');
    }
  };

  const handleApplyVoucherBrand = async (brandId) => {
    if (!voucherCode.trim()) return toast.error('Vui lòng nhập mã');
    try {
      const res = await applyVoucher(voucherCode.toUpperCase(), getSelectedSubTotal()); 
      setAppliedVoucherBrand(prev => ({
        ...prev,
        [brandId]: res.data
      }));
      toast.success(`Áp dụng ${voucherCode.toUpperCase()} thành công!`);
      setVoucherCode('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã không hợp lệ hoặc không đủ điều kiện');
    }
  };


  const handleSelectVoucher = async (v) => {
    try {
      const res = await applyVoucher(v.code, getSelectedSubTotal());  
      setAppliedVoucher(res.data);
      toast.success(`Đã áp dụng ${v.code}`);
      setShowVoucherList(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể áp dụng mã này');
    }
  };

  const handleSelectVoucherBrand = async (v, brandId) => {
    try {
      const res = await applyVoucher(v.code, getSelectedSubTotal());  
      setAppliedVoucherBrand(prev => ({
        ...prev,
        [brandId]: res.data
      }));
      toast.success(`Áp dụng mã  ${v.code} thành công!`);
      setShowVoucherListBrand(prev => ({
        ...prev,
        [brandId]: false
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể áp dụng mã này');
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    toast.info('Đã bỏ mã giảm giá');
  };
  const removeVoucherBrand = () => {
    setAppliedVoucherBrand({});
    toast.info('Đã bỏ mã của shop');
};

  const removeVoucherBrandFor = (brandId) => {
    setAppliedVoucherBrand(prev => {
      const copy = { ...prev };
      delete copy[brandId];
      return copy;
    });
    toast.info('Đã bỏ mã của shop');
  };
  const getSubTotal = () => {
    return getSelectedItems().reduce((sum, i) => sum + i.price * i.quantity, 0);
  };

  const getBrandVoucherDiscount = (brandId) => {
  const voucher = appliedVoucherBrand[brandId];
  if (!voucher) return 0;

  const subtotal = getSubTotal();
  let discount = 0;

  if (voucher.type === 'percentage') {
    discount = subtotal * (Number(voucher.value) || 0) / 100;
    if (voucher.max_discount) {
      discount = Math.min(discount, Number(voucher.max_discount));
    }
  } else if (voucher.type === 'fixed_amount') {
    discount = Number(voucher.value) || 0;
  }

  // Kiểm tra min_order_amount
  if (voucher.min_order_amount && subtotal < Number(voucher.min_order_amount)) {
    return 0;
  }

  return Math.min(discount, subtotal);
};
// Giảm giá từ voucher toàn sàn (admin)
const getPublicVoucherDiscount = () => {
  if (!appliedVoucher) return 0;

  const subtotal = getSubTotal();
  let discount = 0;

  if (appliedVoucher.type === 'percentage') {
    discount = subtotal * (appliedVoucher.value || 0) / 100;
    if (appliedVoucher.max_discount) {
      discount = Math.min(discount, appliedVoucher.max_discount);
    }
  } else {
    discount = appliedVoucher.value || 0;
  }

  return Math.min(discount, subtotal);
};

  const getVoucherDiscount = ()=> {
    let total=0;
    Object.keys(appliedVoucherBrand).forEach(brandId => { 
      total+= getBrandVoucherDiscount(brandId); 
    });
    total+=getPublicVoucherDiscount();
    return total;
  }
  const getFinalTotal = () => getSubTotal() - getVoucherDiscount();

  const getSelectedItems = () => cart.filter(item => selectedItems[item.product_id]);
  const selectedCount = getSelectedItems().length;

  const updateQty = async (id, qty) => {
    if (qty <= 0) await removeFromCartApi(id);
    else await updateCartItemApi(id, qty);
    loadCart();
  };

  const removeItem = async (id) => {
    await removeFromCartApi(id);
    toast.success('Đã xóa khỏi giỏ hàng');
    loadCart();
  };

 
  if (cart.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <h2>Giỏ hàng trống</h2>
        <p>Hãy thêm sản phẩm để đặt hàng!</p>
        <button onClick={() => navigate('/retailer/dashboard')} className={styles.backBtn}>
          Tiếp tục mua sắm
        </button>
      </div>
    );
  }

  return (
        <Layout>

    <div className={styles.cartPage}>

       <button  onClick={() => navigate(-1)}className={styles.backBtn}>  ← Quay lại </button>

 <div className={styles.main}>
    {/* BẢNG SẢN PHẨM – KIỂU CỘT ĐẸP */}
  <div className={styles.cartItems}>
  {/* HEADER CHỌN TẤT CẢ */}
  <div className={styles.cartHeader}>
    <label className={styles.selectAll}>
      <input
        type="checkbox"
        checked={Object.values(selectedItems).every(Boolean) && cart.length > 0}
        onChange={() => {
          const allSelected = Object.values(selectedItems).every(Boolean);
          const newState = {};
          cart.forEach(item => newState[item.product_id] = !allSelected);
          setSelectedItems(newState);
        }}
      />
      <span>Chọn tất cả ({cart.length} sản phẩm)</span>
    </label>
  </div>

  {/* NHÓM THEO BRAND – ĐẸP NHƯ SHOPEE MALL */}
{Object.entries(
  cart.reduce((groups, item) => {
    const brandName = item.brand_name || 'Không có nhãn hàng';
    if (!groups[brandName]) {
      groups[brandName] = {
        brand_name: brandName,
        items: [],
        brand_id: item.brand_id
      };
    }
    groups[brandName].items.push(item);
    return groups;
  }, {})
).map(([brandName, group]) => (
  <div key={group.brand_id || brandName} className={styles.brandGroup}>
    {/* HEADER CỦA TỪNG BRAND */}
    <div className={styles.brandHeader}>
      <label className={styles.brandSelect}>
        <input
          type="checkbox"
          checked={group.items.every(item => selectedItems[item.product_id])}
          onChange={() => {
            const allSelected = group.items.every(item => selectedItems[item.product_id]);
            const newState = { ...selectedItems };
            group.items.forEach(item => {
              newState[item.product_id] = !allSelected;
            });
            setSelectedItems(newState);
          }}
        />
        <strong>{brandName}</strong>
        <span className={styles.itemCount}>({group.items.length} sản phẩm)</span>
      </label>
    </div>

    {/* TIÊU ĐỀ CỘT – THÊM MỚI, ĐẸP NHƯ SHOPEE */}
    <div className={styles.tableHeader}>
      <div></div> {/* Checkbox */}
      <div></div> {/* Ảnh */}
      <div className={styles.headerProductName}>Sản phẩm</div>
      <div className={styles.headerPrice}>Đơn giá</div>
      <div className={styles.headerQty}>Số lượng</div>
      <div className={styles.headerSubtotal}>Số tiền</div>
      <div className={styles.headerAction}>Thao tác</div>
    </div>

    {/* DANH SÁCH SẢN PHẨM CỦA BRAND */}
        <div className={styles.brandItems}>
          {group.items.map(item => (
            <div key={item.product_id} className={styles.brandItem}>
              <div className={styles.itemCheckbox}>
                <input
                  type="checkbox"
                  checked={!!selectedItems[item.product_id]}
                  onChange={() => setSelectedItems(prev => ({
                    ...prev,
                    [item.product_id]: !prev[item.product_id]
                  }))}
                  disabled={!item.is_active}  // Không cho chọn nếu sản phẩm bị ẩn
                />
              </div>

              <div 
                className={styles.productCard} 
                onClick={() => item.is_active && navigate(`/productdetail/${item.product_id}`)}
                style={{ opacity: item.is_active ? 1 : 0.6, cursor: item.is_active ? 'pointer' : 'default' }}
              >
                    <img src={item.image_url}  alt={item.product_name} />
              </div>

              <div className={styles.info}>
                <h4>{item.product_name}</h4>

                {/* CẢNH BÁO KHI BỊ ẨN */}
                {!item.is_active && (
                  <div className={styles.warningMessage}>
                    ⚠️ Sản phẩm này đã ngừng kinh doanh bởi Nhãn hàng
                  </div>
                )}
              </div>

              <div className={styles.price}>
                {Number(item.price).toLocaleString('vi-VN')} ₫
              </div>

              <div className={styles.qty}>
                <div className={styles.qtyControl}>
                  <button 
                    onClick={() => updateQty(item.product_id, item.quantity - 1)}
                    disabled={!item.is_active || item.quantity <= 1}
                  >-</button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => updateQty(item.product_id, item.quantity + 1)}
                    disabled={!item.is_active}
                  >+</button>
                </div>
              </div>

              <div className={styles.subtotal}>
                <strong>{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</strong>
              </div>

              <div className={styles.action}>
                <button 
                  onClick={() => removeItem(item.product_id)} 
                  className={styles.remove}
                  title="Xóa khỏi giỏ hàng"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      <div className={styles.voucherBox}>
            <div className={styles.voucherHeader}>
              <span className={styles.voucherTitle}>
                Mã khuyến mãi của nhãn hàng ({availableVouchersBrand[group.brand_id]?.length || 0})
              </span>
              <button 
                  onClick={() => {
                    setShowVoucherListBrand(prev => {
                const currentlyOpen = !!prev[group.brand_id];
                const newState = { ...prev, [group.brand_id]: !currentlyOpen };

                // Chỉ load khi mở lần đầu
                if (!currentlyOpen && !availableVouchersBrand[group.brand_id]) {
                  loadAvailableVouchersBrand(group.brand_id);
                }

                return newState;
              });
            }}
            className={styles.toggleVoucherList}
          >
            {showVoucherListBrand[group.brand_id] ? 'Ẩn mã' : 'Chọn mã của shop'}
          </button>
            </div>

           {showVoucherListBrand[group.brand_id] && (
                <div className={styles.voucherList}>
                  {loadingVouchersBrand && !availableVouchersBrand[group.brand_id] ? (
                    <p>Đang tải mã của shop...</p>
                  ) : !availableVouchersBrand[group.brand_id]?.length ? (
                    <p>Shop này chưa có mã giảm giá</p>
                  ) : (
                    availableVouchersBrand[group.brand_id].map(v => (
                      <div
                        key={v.promotion_id}
                        className={`${styles.voucherItem} ${appliedVoucherBrand[group.brand_id]?.promotion_id === v.promotion_id ? styles.voucherApplied : ''}`}
                        onClick={() => handleSelectVoucherBrand(v, group.brand_id)}
                      >
                          <div className={styles.voucherLeft}>
                            <div className={styles.voucherCode}>{v.code}</div>
                            <div className={styles.voucherDesc}>
                              {v.type === 'percentage' 
                                ? `Giảm ${v.value}%` 
                                : `Giảm ${Number(v.value).toLocaleString()}đ`}
                              {v.min_order_amount > 0 && ` • Đơn từ ${Number(v.min_order_amount).toLocaleString()}đ`}
                            </div>
                          </div>
                          <div className={styles.voucherRight}>
                            {appliedVoucherBrand[group.brand_id]?.promotion_id === v.promotion_id ? (
                              <span className={styles.usedText}>Đã dùng</span>
                            ) : (
                              <button className={styles.useBtn}>Dùng ngay</button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

            <div className={styles.voucherInputWrapper}>
              <input
                type="text"
                value={voucherCode}
                onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                onKeyPress={e => e.key === 'Enter' && handleApplyVoucherBrand(group.brand_id)}
                placeholder="Nhập mã khuyến mãi"
                disabled={!!appliedVoucherBrand[group.brand_id]}
              />
              <button
                onClick={() => handleApplyVoucherBrand(group.brand_id)}
                disabled={!voucherCode.trim() || !!appliedVoucherBrand[group.brand_id]}
                className={styles.applyBtn}
              >
                Áp dụng
              </button>
            </div>

            {appliedVoucherBrand[group.brand_id] && (
              <div className={styles.appliedVoucher}>
                <span>
                  Đã áp dụng: <strong>{appliedVoucherBrand[group.brand_id].code}</strong>
                  {' • '}Giảm <strong>{getBrandVoucherDiscount(group.brand_id).toLocaleString()}đ</strong>
                </span>
                <button onClick={() => removeVoucherBrandFor(group.brand_id)} className={styles.removeVoucher}>×</button>
              </div>
            )}
          </div>
    </div>
))}
</div>
        {/* Thanh toán + Voucher THẬT TỪ API */}
        <div className={styles.checkout}>
          <div className={styles.voucherBox}>
            <div className={styles.voucherHeader}>
              <span className={styles.voucherTitle}>
                Mã khuyến mãi ({availableVouchers.length})
              </span>
              <button onClick={() => setShowVoucherList(!showVoucherList)} className={styles.toggleVoucherList}>
                {showVoucherList ? 'Ẩn danh sách' : 'Chọn mã'}
              </button>
            </div>

            {showVoucherList && (
              <div className={styles.voucherList}>
                {loadingVouchers ? (
                  <p>Đang tải khuyến mãi...</p>
                ) : availableVouchers.length === 0 ? (
                  <p>Không có khuyến mãi nào đang hoạt động</p>
                ) : (
                  availableVouchers.map(v => (
                    <div
                      key={v.promotion_id}
                      className={`${styles.voucherItem} ${appliedVoucher?.promotion_id === v.promotion_id ? styles.voucherApplied : ''}`}
                      onClick={() => handleSelectVoucher(v)}
                    >
                      <div className={styles.voucherLeft}>
                        <div className={styles.voucherCode}>{v.code}</div>
                        <div className={styles.voucherDesc}>
                          {v.type === 'percentage' ? `Giảm ${v.value}%` : `Giảm ${Number(v.value).toLocaleString()}đ`}
                          {v.min_order_amount > 0 && ` • Đơn từ ${Number(v.min_order_amount).toLocaleString()}đ`}
                        </div>
                      </div>
                      <div className={styles.voucherRight}>
                        {appliedVoucher?.promotion_id === v.promotion_id ? (
                          <span className={styles.usedText}>Đã dùng</span>
                        ) : (
                          <button className={styles.useBtn}>Dùng ngay</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

                          {/* Voucher của shop */}
              {Object.entries(appliedVoucherBrand || {}).length > 0 && (
                Object.entries(appliedVoucherBrand).map(([brandId, v]) => (
                  <div key={brandId} className={styles.appliedVoucher}>
                    <span>
                      Mã của shop: <strong>{v.code}</strong>
                      {' • '}Giảm <strong>{getBrandVoucherDiscount(brandId).toLocaleString()}đ</strong>
                    </span>
                    <button onClick={() => removeVoucherBrandFor(brandId)} className={styles.removeVoucher}>×</button>
                  </div>
                ))
              )}

              {/* Voucher toàn sàn */}
              {appliedVoucher && (
                <div className={styles.appliedVoucher}>
                  <span>
                    Mã toàn sàn: <strong>{appliedVoucher.code}</strong>
                    {' • '}Giảm <strong>{(getVoucherDiscount() - Object.keys(appliedVoucherBrand || {}).reduce((s, b) => s + getBrandVoucherDiscount(b), 0)).toLocaleString()}đ</strong>
                  </span>
                  <button onClick={removeVoucher} className={styles.removeVoucher}>×</button>
                </div>
              )}
          </div>

          {/* Tổng kết */}
          <div className={styles.summary}>
            <p>Đã chọn: <strong>{selectedCount}/{cart.length}</strong> sản phẩm</p>
            <p>Tạm tính: <strong>{getSubTotal().toLocaleString()}đ</strong></p>

            {/* Hiện voucher đã áp dụng */}
                      {Object.keys(appliedVoucherBrand).length > 0 && (
              Object.keys(appliedVoucherBrand).map(brandId => (
                <p key={brandId} className={styles.discountLine}>
                  Giảm giá (mã {appliedVoucherBrand[brandId].code}): 
                  <strong className={styles.discount}>
                    -{getBrandVoucherDiscount(brandId).toLocaleString('vi-VN')}đ
                  </strong>
                </p>
              ))
            )}
            {appliedVoucher && (
              <p className={styles.discountLine}>
                Giảm giá (mã của hệ thống {appliedVoucher.code}): 
                <strong className={styles.discount}>
                  -{getPublicVoucherDiscount().toLocaleString('vi-VN')}đ
                </strong>
              </p>
            )}

            <p className={styles.grandTotal}>
              Tổng thanh toán: <strong className={styles.finalPrice}>
                {getFinalTotal().toLocaleString()}đ
              </strong>
            </p>
          <button onClick={() => {
          const selected = getSelectedItems();
          if (selected.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 sản phẩm!');
            return;
          }

          // 1. TÍNH GIÁ SAU KHI ÁP DỤNG VOUCHER
          const itemsWithDiscount = selected.map(item => {
            // Giá gốc
            const originalPrice = item.price;
            let finalPrice = originalPrice;
            
            // Tính giảm giá từ voucher của brand (nếu có)
            if (item.brand_id && appliedVoucherBrand[item.brand_id]) {
              const brandDiscount = getBrandVoucherDiscount(item.brand_id);
              // Phân bổ giảm giá theo giá trị sản phẩm
              const brandSubtotal = getSubTotal();
              if (brandSubtotal > 0) {
                const itemRatio = (item.price * item.quantity) / brandSubtotal;
                finalPrice = finalPrice - (brandDiscount * itemRatio / item.quantity);
              }
            }
            
            // Tính giảm giá từ voucher toàn sàn (nếu có)
            if (appliedVoucher) {
              const publicDiscount = getPublicVoucherDiscount();
              const publicSubtotal = getSubTotal();
              if (publicSubtotal > 0) {
                const itemRatio = (item.price * item.quantity) / publicSubtotal;
                finalPrice = finalPrice - (publicDiscount * itemRatio / item.quantity);
              }
            }
            
            // Đảm bảo giá không âm
            finalPrice = Math.max(finalPrice, 0);
            
            return {
              // Thông tin cơ bản
              product_id: item.product_id,
              quantity: item.quantity,
              
              // QUAN TRỌNG: lưu cả giá gốc và giá đã giảm
              price: finalPrice, // Giá sau khi áp dụng voucher
              original_price: originalPrice, // Giá gốc
              
              // Thông tin sản phẩm cho tính toán vận chuyển
              product_name: item.product_name,
              weight_kg: item.weight_kg || 0,
              volume_m3: item.volume_m3 || 0,
              shipping_type_id: item.shipping_type_id || 1,
              vehicle_type: item.vehicle_type || 'xe_may',
              suggested_vehicle: item.suggested_vehicle || 'xe_may',
              brand_id: item.brand_id,
              image: item.image_url || item.image || '',
              
              // Thông tin voucher đã áp dụng
              applied_vouchers: {
                brand_voucher: item.brand_id && appliedVoucherBrand[item.brand_id] ? {
                  code: appliedVoucherBrand[item.brand_id].code,
                  discount: getBrandVoucherDiscount(item.brand_id)
                } : null,
                public_voucher: appliedVoucher ? {
                  code: appliedVoucher.code,
                  discount: getPublicVoucherDiscount()
                } : null
              }
            };
          });

          
          // 2. Lưu vào localStorage
          localStorage.setItem('checkout_items', JSON.stringify(itemsWithDiscount));
          
          // 3. Lưu thông tin tổng voucher để Checkout hiển thị
          const voucherInfo = {
            total_discount: getVoucherDiscount(),
            final_subtotal: getFinalTotal(),
            applied_brand_vouchers: appliedVoucherBrand,
            applied_public_voucher: appliedVoucher,
            subtotal: getSubTotal()
          };
          localStorage.setItem('checkout_voucher_info', JSON.stringify(voucherInfo));
          
          // 4. Điều hướng đến checkout
          navigate('/retailer/checkout');
        }} 
        className={styles.checkoutBtn} 
        disabled={selectedCount === 0}
        >
          TIẾN HÀNH THANH TOÁN ({selectedCount})
        </button>
                    </div>
                  </div>
                </div>

              </div>        
       </Layout>
            );
          }
export default Cart;