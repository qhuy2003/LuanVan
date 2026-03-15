import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.scss';
import UserMenu from '../UserMenu/UserMenu';
import { Link } from 'react-router-dom';

function Header({ 
  showSearch = false, 
  searchQuery = '', 
  onSearchChange = null,
  cartCount = 0,
  onCartClick = null,
  showLoginBtn = true  
}) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Ẩn nút nếu: prop showLoginBtn = false HOẶC đang ở trang /login
const shouldShowLoginBtn = showLoginBtn && 
    !['/login', '/register'].includes(location.pathname);
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logo} onClick={() => navigate('/')}>
          <div className={styles.logoIcon}>QH</div>
          <div className={styles.logoText}>
            <span className={styles.brandName}>Logistics</span>
            <span className={styles.tagline}>Giao hàng nhanh chóng</span>
          </div>
        </div>

        {/* Search Bar (Optional) */}
        {showSearch && (
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, nhãn hàng..."
              value={searchQuery}
              onChange={onSearchChange}
              className={styles.searchInput}
            />
            <button className={styles.searchBtn}>
              🔍
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>Trang chủ</Link>
          <Link to="/about" className={styles.navLink}>Về chúng tôi</Link>
          <Link to="/about" className={styles.navLink}>Dịch vụ</Link>
          <Link to="/about" className={styles.navLink}>Liên hệ</Link>
        </nav>

        {/* Right Actions */}
        <div className={styles.actions}>
          {/* Cart Icon */}
          {user.role === 'retailer' && (
            <div 
              className={styles.cartIcon} 
              onClick={onCartClick || (() => navigate('/cart'))}
            >
              🛒
              {cartCount > 0 && (
                <span className={styles.cartBadge}>{cartCount}</span>
              )}
            </div>
          )}

          {/* User Menu hoặc nút Đăng nhập */}
          {user.user_id ? (
            <UserMenu />
          ) : (
            shouldShowLoginBtn && (
              <button 
                className={styles.loginBtn}
                onClick={() => navigate('/login')}
              >
                Đăng nhập
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;