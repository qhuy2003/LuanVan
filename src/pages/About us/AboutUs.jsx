import React from 'react';
import styles from './AboutUs.module.scss';
import Layout from '../../components/Layout/Layout';
import Footer from '../../components/Footer/Footer';

function AboutUs() {
  return (
    <Layout>
      <div className={styles.aboutPage}>
        <div className={styles.hero}>
          <h1>Về Chúng Tôi</h1>
          <p>Kết nối nhãn hàng – đại lý – shipper, mang giá trị thực đến từng gian hàng</p>
        </div>

        <div className={styles.container}>
          {/* Giới thiệu ngắn */}
          <section className={styles.intro}>
            <h2>Chúng tôi là ai?</h2>
            <p>
              Chúng tôi là nền tảng thương mại điện tử <strong>B2B</strong> chuyên biệt dành cho kênh phân phối bán lẻ tại Việt Nam. Với sứ mệnh kết nối trực tiếp giữa <strong>nhãn hàng (brand)</strong>, <strong>đại lý bán lẻ (retailer)</strong> và <strong>người giao hàng (shipper)</strong>, chúng tôi giúp tối ưu hóa chuỗi cung ứng, giảm chi phí trung gian và tăng hiệu quả kinh doanh cho mọi bên tham gia.
            </p>
            <p>
              Được xây dựng từ nhu cầu thực tế của thị trường phân phối, hệ thống mang đến giải pháp toàn diện: quản lý sản phẩm sỉ, đặt hàng nhanh, thanh toán linh hoạt và giao hàng tối ưu.
            </p>
          </section>

          {/* Sứ mệnh & Giá trị */}
          <section className={styles.mission}>
            <h2>Sứ mệnh & Giá trị cốt lõi</h2>
            <div className={styles.valuesGrid}>
              <div className={styles.valueCard}>
                <h3>Minh bạch</h3>
                <p>Giá sỉ rõ ràng, tồn kho realtime, không phí ẩn.</p>
              </div>
              <div className={styles.valueCard}>
                <h3>Tốc độ</h3>
                <p>Đặt hàng – xác nhận – giao hàng nhanh chóng trong ngày.</p>
              </div>
              <div className={styles.valueCard}>
                <h3>Hiệu quả</h3>
                <p>Tối ưu lộ trình giao hàng, giảm tồn kho dư thừa, tăng doanh thu.</p>
              </div>
              <div className={styles.valueCard}>
                <h3>Hỗ trợ</h3>
                <p>Đội ngũ hỗ trợ 24/7 cho brand, retailer và shipper.</p>
              </div>
            </div>
          </section>

          {/* Lịch sử phát triển (tùy chọn) */}
          <section className={styles.history}>
            <h2>Hành trình của chúng tôi</h2>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={styles.year}>2024</div>
                <div className={styles.content}>
                  <h3>Khởi đầu ý tưởng</h3>
                  <p>Nhận thấy khó khăn trong phân phối bán lẻ truyền thống, chúng tôi bắt đầu xây dựng nền tảng kết nối trực tiếp.</p>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.year}>2025</div>
                <div className={styles.content}>
                  <h3>Ra mắt phiên bản đầu tiên</h3>
                  <p>Hỗ trợ quản lý sản phẩm sỉ, thanh toán online (VNPay, ZaloPay) và phân công shipper.</p>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.year}>2026</div>
                <div className={styles.content}>
                  <h3>Hiện tại</h3>
                  <p>Hàng trăm nhãn hàng và đại lý đã tin dùng, với mục tiêu trở thành nền tảng B2B phân phối hàng đầu Việt Nam.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Lời kết */}
          <section className={styles.conclusion}>
            <h2>Hãy cùng phát triển</h2>
            <p>
              Chúng tôi luôn lắng nghe và đồng hành cùng nhãn hàng, đại lý và shipper để xây dựng một hệ sinh thái phân phối bền vững, hiệu quả và công bằng.
            </p>
            <p>
              Cảm ơn bạn đã tin tưởng và đồng hành cùng chúng tôi!
            </p>
          </section>
        </div>
      </div>

    </Layout>
  );
}

export default AboutUs;