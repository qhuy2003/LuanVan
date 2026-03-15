import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './UserMenu.module.scss';

function UserMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isBrand = user?.role === 'brand';
  const isretila = user?.role ==='retailer';
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Đã đăng xuất thành công!', {
      position: "top-right",
      autoClose: 3000,
    });
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  const handleProfile = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  return (
    <div className={styles.userMenu}>
      <div 
        className={styles.userAvatar}
        onClick={() => setIsOpen(!isOpen)}
      >
        <img 
          src={user.avatar || 'https://via.placeholder.com/40?text=U'} 
          alt={user.full_name || 'User'}
          className={styles.avatarImg}
        />
        <span className={styles.userName}>
          {/* {user.profile.brand_id || user.email || 'User'} */}
          {user.full_name || user.email || 'User'}
        </span>
        <i className={`fas fa-chevron-down ${styles.dropdownIcon} ${isOpen ? styles.open : ''}`}></i>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <img src={user.avatar || 'https://via.placeholder.com/60'} alt="Avatar" />
            <div>
              <p className={styles.name}>{user.full_name || 'Người dùng'}</p>
              <p className={styles.email}>{user.email}</p>
            </div>
          </div>
          
          <div className={styles.dropdownItem} onClick={handleProfile}>
            <i className="fas fa-user"></i>
            Thông tin cá nhân
          </div>
          
          {isretila && ( 
          <div className={styles.dropdownItem} onClick={() => { setIsOpen(false); navigate('/retailer/orders') }}>
            <i className="fas fa-shopping-bag"></i>
            Đơn hàng của tôi
          </div>)}

          <hr className={styles.divider} />

          <div className={styles.dropdownItem} onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            Đăng xuất
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;