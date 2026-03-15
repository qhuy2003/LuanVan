import React from 'react';
import styles from './Footer.module.scss';

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Footer Top */}
        <div className={styles.footerTop}>
          {/* Company Info */}
          <div className={styles.footerSection}>
            <div className={styles.footerLogo}>
              <div className={styles.logoIcon}>QH</div>
              <span className={styles.brandName}> Logistics</span>
            </div>
            <p className={styles.description}>
              Giải pháp logistics toàn diện, kết nối nhãn hàng và nhà bán lẻ. 
              Giao hàng nhanh chóng, an toàn, uy tín.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialIcon}>📘</a>
              <a href="#" className={styles.socialIcon}>📷</a>
              <a href="#" className={styles.socialIcon}>🐦</a>
              <a href="#" className={styles.socialIcon}>📧</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>Liên kết nhanh</h3>
            <ul className={styles.footerLinks}>
              <li><a href="/">Trang chủ</a></li>
              <li><a href="/about">Về chúng tôi</a></li>
              <li><a href="/about">Dịch vụ</a></li>
              <li><a href="/about">Tra cứu đơn hàng</a></li>
              <li><a href="/aboutr">Bảng giá</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>Dịch vụ</h3>
            <ul className={styles.footerLinks}>
              <li>Vận chuyển thông thường</li>
              <li>Vận chuyển đông lạnh</li>
              <li>Vận chuyển hàng nặng</li>
              <li>Vận chuyển hàng dễ vỡ</li>
              <li>Giao hàng nhanh</li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>Liên hệ</h3>
            <ul className={styles.contactList}>
              <li>
                <span className={styles.contactIcon}>📍</span>
                <span>123 Đường Nguyễn Văn Linh, Q.7, TP.HCM</span>
              </li>
              <li>
                <span className={styles.contactIcon}>📞</span>
                <span>Hotline: 1900 xxxx</span>
              </li>
              <li>
                <span className={styles.contactIcon}>✉️</span>
                <span>Email: support@qhlogistics.vn</span>
              </li>
              <li>
                <span className={styles.contactIcon}>🕐</span>
                <span>T2-CN: 7:00 - 22:00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className={styles.footerBottom}>
          <div className={styles.copyright}>
            <p>© 2025 QH Logistics. All rights reserved.</p>
          </div>
          <div className={styles.policies}>
            <a href="/terms">Điều khoản sử dụng</a>
            <span className={styles.divider}>|</span>
            <a href="/privacy">Chính sách bảo mật</a>
            <span className={styles.divider}>|</span>
            <a href="/shipping-policy">Chính sách vận chuyển</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
