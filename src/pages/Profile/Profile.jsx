import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './Profile.module.scss';
import { getMyProfile, updateMyProfile, changeMyPassword } from '../../api/ProfileApi';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from '../../components/Layout/Layout';
import Footer from '../../components/Footer/Footer';
import axios from 'axios';
// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TRACK_ASIA_KEY = "5c0d7f270cc9f552c97176379794591cdb";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  // Form thông tin cá nhân
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [storeName, setStoreName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [editingInfo, setEditingInfo] = useState(false);

  // Warehouse location (for Brand)
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [warehouseSuggestions, setWarehouseSuggestions] = useState([]);
  const [warehouseCoords, setWarehouseCoords] = useState({ lat: null, lng: null });
  const [editingWarehouse, setEditingWarehouse] = useState(false);
  const mapRef = useRef();
  const warningTimeoutRef = useRef(null);

  // Avatar
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Form đổi mật khẩu
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getMyProfile();
        const fullUser = res.data;
        localStorage.setItem('user', JSON.stringify(fullUser));
        setUser(fullUser);

        setFullName(fullUser.full_name || '');
        setPhoneNumber(fullUser.profile?.phone || '');
        setAddress(fullUser.profile?.address || '');
        setStoreName(fullUser.profile?.store_name || '');
        setBrandName(fullUser.profile?.brand_name || '');

        // Load warehouse coordinates for Brand
        if (fullUser.role === 'brand' && fullUser.profile) {
          setWarehouseAddress(fullUser.profile?.warehouse_address || '');
          if (fullUser.profile?.warehouse_lat && fullUser.profile?.warehouse_lng) {
            setWarehouseCoords({
              lat: parseFloat(fullUser.profile.warehouse_lat),
              lng: parseFloat(fullUser.profile.warehouse_lng)
            });
          }
        }

        setAvatarPreview(fullUser.avatar || '');
      } catch (err) {
        toast.error('Không tải được thông tin');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh: JPG, PNG, GIF, WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được lớn hơn 5MB');
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
  if (!fullName.trim()) return toast.error('Vui lòng nhập họ tên!');

  const formDataSubmit = new FormData();

  formDataSubmit.append('full_name', fullName.trim());
  formDataSubmit.append('phone_number', phoneNumber.trim());
  
  if (user.role === 'brand' || user.role === 'retailer') {
    formDataSubmit.append('address', address.trim());
  }
  
  if (avatarFile) {
    formDataSubmit.append('avatar', avatarFile);
  }

  if (user.role === 'brand') {
    const currentBrandName = brandName.trim() || user.profile?.brand_name || '';
    formDataSubmit.append('brand_name', currentBrandName);

    // Add warehouse coordinates if available
    if (warehouseAddress) {
      formDataSubmit.append('warehouse_address', warehouseAddress.trim());
    }
    if (warehouseCoords?.lat && warehouseCoords?.lng) {
      formDataSubmit.append('warehouse_lat', warehouseCoords.lat);
      formDataSubmit.append('warehouse_lng', warehouseCoords.lng);
    }
  }

  if (user.role === 'retailer') {
    const currentStoreName = storeName.trim() || user.profile?.store_name || '';
    formDataSubmit.append('store_name', currentStoreName);
  }


  try {
    await updateMyProfile(formDataSubmit);

    const res = await getMyProfile();
    const updatedUser = res.data;

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    setFullName(updatedUser.full_name || '');
    setPhoneNumber(updatedUser.profile?.phone || '');
    setAddress(updatedUser.profile?.address || '');
    setBrandName(updatedUser.profile?.brand_name || '');
    setStoreName(updatedUser.profile?.store_name || '');
    setAvatarPreview(updatedUser.avatar || '');
    setAvatarFile(null);

    // Update warehouse info if brand
    if (updatedUser.role === 'brand' && updatedUser.profile) {
      setWarehouseAddress(updatedUser.profile?.warehouse_address || '');
      if (updatedUser.profile?.warehouse_lat && updatedUser.profile?.warehouse_lng) {
        setWarehouseCoords({
          lat: parseFloat(updatedUser.profile.warehouse_lat),
          lng: parseFloat(updatedUser.profile.warehouse_lng)
        });
      }
      setEditingWarehouse(false);
    }

    setEditingInfo(false);
    toast.success('Cập nhật thông tin thành công!');
  } catch (err) {
    console.error('Update error:', err);
    toast.error(err.response?.data?.message || 'Cập nhật thất bại!');
  }
};

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return toast.error('Mật khẩu mới không khớp!');
    if (newPassword.length < 6) return toast.error('Mật khẩu phải từ 6 ký tự trở lên!');

    try {
      await changeMyPassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      });
      toast.success('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangingPassword(false);
      setShowCurrentPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại!');
    }
  };

  const handleCancelEdit = () => {
    setFullName(user.full_name || '');
    setPhoneNumber(user.profile?.phone || '');
    setAddress(user.profile?.address || '');
    setBrandName(user.profile?.brand_name || '');
    setStoreName(user.profile?.store_name || '');
    setAvatarFile(null);
    setAvatarPreview(user.avatar || '');
    setEditingInfo(false);
  };

  // Warehouse address search
  const searchWarehouseAddress = async (query) => {
    if (!query || query.trim().length < 3) {
      setWarehouseSuggestions([]);
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
                 address.toLowerCase().includes('ho chi minh');
        }).slice(0, 5);
        
        setWarehouseSuggestions(tpHcmResults.map(r => ({
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
      setWarehouseSuggestions([]);
    }
  };

  const selectWarehouseAddress = (place) => {
    setWarehouseAddress(place.label);
    setWarehouseCoords({ lat: place.lat, lng: place.lng });
    setWarehouseSuggestions([]);
    
    if (mapRef.current) {
      mapRef.current.setView([place.lat, place.lng], 15);
    }
    
    toast.success(`Đã chọn địa chỉ kho: ${place.label}`);
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
     
    <div className={styles.profilePage}>
            <button 
          onClick={() => navigate(-1)} 
          className={styles.backBtn}
        >
          ← Quay lại
        </button>
      <div className={styles.container}>
        <h1 className={styles.title}>Thông tin cá nhân</h1>

        <div className={styles.card}>
          {/* Header với avatar */}
          <div className={styles.header}>
            <div className={styles.avatarWrapper}>
              <img 
                src={avatarPreview || 'https://via.placeholder.com/120?text=U'} 
                alt="Avatar" 
                className={styles.avatar}
              />
              {editingInfo && (
                <label className={styles.avatarUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className={styles.avatarInput}
                  />
                  <span className={styles.uploadIcon}>📷</span>
                  <span className={styles.uploadText}>Thay đổi ảnh</span>
                </label>
              )}
            </div>
            <div className={styles.info}>
              <h2>{user.full_name || 'Chưa đặt tên'}</h2>
              <p>{user.email}</p>
              <span className={styles.role}>
                {user.role === 'retailer' ? 'Nhà bán lẻ' : user.role === 'brand' ? 'Nhãn hàng' : 'Người giao hàng'}
              </span>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Thông tin cá nhân</h3>
            </div>

            {!editingInfo && (
              <div className={styles.infoDisplay}>
                <p><strong>Họ tên:</strong> {user.full_name || 'Chưa đặt'}</p>
                <p><strong>Số điện thoại:</strong> {user.profile?.phone || 'Chưa có'}</p>
                {/* {(user.role === 'brand' ) && (
                  <p><strong>Địa chỉ:</strong> {user.profile?.address || 'Chưa có'}</p>
                )} */}
                {user.role === 'brand' && (
                  <p><strong>Thương hiệu:</strong> {user.profile?.brand_name || 'Chưa đặt'}</p>
                )}

                {user.role === 'retailer' && (
                  <p><strong>Cửa hàng:</strong> {user.profile?.store_name || 'Chưa đặt'}</p>
                )}
                
              </div>
            )}

            {editingInfo && (
              <div className={styles.editForm}>
                <div className={styles.inputGroup}>
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nhập họ tên"
                    className={styles.input}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className={styles.input}
                  />
                </div>
                {/* {(user.role === 'brand' || user.role === 'retailer') && (
                  <div className={styles.inputGroup}>
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Nhập địa chỉ (tùy chọn)"
                      className={styles.input}
                    />
                  </div>
                )} */}

                {user.role === 'brand' && (
                  <div className={styles.inputGroup}>
                    <label>Tên thương hiệu</label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={e => setBrandName(e.target.value)}
                      placeholder="Nhập tên thương hiệu"
                      className={styles.input}
                    />
                  </div>
                )}

                {user.role === 'retailer' && (
                  <div className={styles.inputGroup}>
                    <label>Tên cửa hàng</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      placeholder="Nhập tên cửa hàng"
                      className={styles.input}
                    />
                  </div>
                  
                )}
              </div>
            )}

            {editingInfo ? (
              <div className={styles.actions}>
                <button onClick={handleUpdateProfile} className={styles.saveBtn}>
                  Lưu thay đổi
                </button>
                <button onClick={handleCancelEdit} className={styles.cancelBtn}>
                  Hủy
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingInfo(true)} className={styles.changePassBtn}>
                Thay đổi thông tin
              </button>
            )}
          </div>

          <hr className={styles.divider} />

          {/* Chọn địa chỉ kho hàng cho Brand */}
          {user.role === 'brand' && (
            <div className={styles.section}>
              <h3>Địa chỉ kho hàng</h3>
              {editingWarehouse ? (
                <div className={styles.warehouseForm}>
                  <div className={styles.inputGroup}>
                    <label>Tìm kiếm địa chỉ kho</label>
                    <input
                      type="text"
                      placeholder="Nhập địa chỉ kho (vd: 123 Nguyễn Huệ, TP.HCM)"
                      value={warehouseAddress}
                      onChange={(e) => {
                        setWarehouseAddress(e.target.value);
                        if (e.target.value.length > 2) {
                          searchWarehouseAddress(e.target.value);
                        } else {
                          setWarehouseSuggestions([]);
                        }
                      }}
                      className={styles.input}
                    />
                  </div>

                  {warehouseSuggestions.length > 0 && (
                    <div className={styles.suggestionsList}>
                      {warehouseSuggestions.map((place, idx) => (
                        <div
                          key={idx}
                          className={styles.suggestionItem}
                          onClick={() => selectWarehouseAddress(place)}
                        >
                          <i className="fas fa-map-marker-alt"></i>
                          <div>
                            <p className={styles.suggestionTitle}>{place.label}</p>
                            <small className={styles.suggestionDesc}>{place.description}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {warehouseCoords.lat && warehouseCoords.lng && (
                    <div className={styles.mapContainer}>
                      <MapContainer
                        center={[warehouseCoords.lat, warehouseCoords.lng]}
                        zoom={15}
                        style={{ height: '300px', width: '100%', borderRadius: '8px' }}
                        ref={mapRef}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; OpenStreetMap contributors'
                        />
                        <Marker position={[warehouseCoords.lat, warehouseCoords.lng]}>
                          <Popup>
                            Kho hàng: {warehouseAddress}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  )}

                  {/* {warehouseCoords.lat && warehouseCoords.lng && (
                    <div className={styles.coordinatesBox}>
                      <p><strong>Tọa độ:</strong></p>
                      <p>Vĩ độ (Latitude): <code>{warehouseCoords.lat.toFixed(6)}</code></p>
                      <p>Kinh độ (Longitude): <code>{warehouseCoords.lng.toFixed(6)}</code></p>
                    </div>
                  )} */}

                  <div className={styles.actions}>
                    <button onClick={handleUpdateProfile} className={styles.saveBtn}>
                      Lưu địa chỉ kho
                    </button>
                    <button onClick={() => setEditingWarehouse(false)} className={styles.cancelBtn}>
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.warehouseInfo}>
                  {warehouseAddress ? (
                    <>
                      <p><strong>Địa chỉ:</strong> {warehouseAddress}</p>
                      {warehouseCoords.lat && warehouseCoords.lng && (
                        <p><strong>Tọa độ:</strong> {warehouseCoords.lat.toFixed(6)}, {warehouseCoords.lng.toFixed(6)}</p>
                      )}
                    </>
                  ) : (
                    <p className={styles.noData}>Vui lòng cập nhật địa chỉ kho hàng</p>
                  )}
                  <button onClick={() => setEditingWarehouse(true)} className={styles.changePassBtn}>
                    {warehouseAddress ? 'Thay đổi địa chỉ' : 'Thêm địa chỉ'}
                  </button>
                </div>
              )}
            </div>
          )}

          <hr className={styles.divider} />

          {/* Đổi mật khẩu */}
          <div className={styles.section}>
            <h3>Đổi mật khẩu</h3>
            {changingPassword ? (
              <div className={styles.passwordForm}>
                {/* Mật khẩu hiện tại */}
                <div className={styles.passwordWrapper}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    placeholder="Mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className={styles.input}
                  />
                  <span 
                    className={styles.eyeIcon}
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                  >
                    <i className={showCurrentPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </span>
                </div>

                {/* Mật khẩu mới */}
                <div className={styles.passwordWrapper}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Mật khẩu mới"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className={styles.input}
                  />
                  <span 
                    className={styles.eyeIcon}
                    onClick={() => setShowNewPass(!showNewPass)}
                  >
                    <i className={showNewPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </span>
                </div>

                {/* Xác nhận mật khẩu */}
                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={styles.input}
                  />
                  <span 
                    className={styles.eyeIcon}
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                  >
                    <i className={showConfirmPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </span>
                </div>

                <div className={styles.actions}>
                  <button onClick={handleChangePassword} className={styles.saveBtn}>
                    Đổi mật khẩu
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setChangingPassword(false);
                      setShowCurrentPass(false);
                      setShowNewPass(false);
                      setShowConfirmPass(false);
                    }} 
                    className={styles.cancelBtn}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setChangingPassword(true)}
                className={styles.changePassBtn}
              >
                Đổi mật khẩu
              </button>
            )}
          </div>
        </div>

  
      </div>
    </div>
  );
  
}

export default Profile;