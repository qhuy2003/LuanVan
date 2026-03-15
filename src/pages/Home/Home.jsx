import React, { useState, useRef, useEffect } from 'react';
import { FaTruck, FaWarehouse, FaStore, FaUserShield, FaChartLine, FaBoxOpen, FaMoneyBillWave, FaShieldAlt, FaClock, FaChevronLeft, FaChevronRight, FaLeaf, FaBolt, FaGlobeAsia } from 'react-icons/fa';
import { MdInventory, MdLocalShipping, MdAccountCircle, MdAnalytics, MdDiscount, MdLocationOn, MdSecurity } from 'react-icons/md';
import { GiDeliveryDrone, GiReceiveMoney } from 'react-icons/gi';
import styles from './Home.module.scss';
import Layout from '../../components/Layout/Layout';

export default function Home() {
  const [activeRole, setActiveRole] = useState('admin');
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Slides với hình ảnh tươi sáng và gradient
  const slides = [
    {
      id: 1,
      title: 'Vận chuyển thông minh',
      description: 'Tự động chọn xe máy/xe tải phù hợp với loại hàng hóa',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: <FaTruck />,
      accentColor: '#667eea'
    },
    {
      id: 2,
      title: 'Theo dõi thời gian thực',
      description: 'Cập nhật trạng thái đơn hàng liên tục 24/7',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: <MdLocationOn />,
      accentColor: '#f093fb'
    },
    {
      id: 3,
      title: 'Tính phí tự động',
      description: 'Tự động tính toán chi phí theo khoảng cách và loại hàng',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      icon: <GiReceiveMoney />,
      accentColor: '#4facfe'
    },
    {
      id: 4,
      title: 'Bảo mật tối đa',
      description: 'Hệ thống bảo mật đa lớp cho mọi giao dịch',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      icon: <MdSecurity />,
      accentColor: '#43e97b'
    }
  ];

  // Auto play slides
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        nextSlide();
      }, 5000);
    }
  };

  // Tính năng hệ thống với icons đa dạng
  const systemFeatures = [
    {
      icon: <FaBolt />,
      title: 'Xử lý nhanh',
      description: 'Đơn hàng được xử lý trong vòng 30 phút',
      color: '#FF6B6B'
    },
    {
      icon: <FaGlobeAsia />,
      title: 'TP.HCM',
      description: 'Phủ sóng toàn khu vực TP.HCM',
      color: '#4ECDC4'
    },
    {
      icon: <FaLeaf />,
      title: 'Thân thiện',
      description: 'Giao diện trực quan, dễ sử dụng',
      color: '#45B7D1'
    },
    {
      icon: <GiDeliveryDrone />,
      title: 'Giao hàng',
      description: 'Đa dạng phương thức vận chuyển',
      color: '#96CEB4'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Bảo mật',
      description: 'Dữ liệu được mã hóa và bảo vệ',
      color: '#FFEAA7'
    },
    {
      icon: <FaChartLine />,
      title: 'Báo cáo',
      description: 'Thống kê chi tiết doanh thu',
      color: '#DDA0DD'
    }
  ];

  const roles = [
    {
      id: 'admin',
      name: 'Quản trị viên',
      icon: <FaUserShield />,
      color: '#FF6B6B',
      features: [
        'Quản lý người dùng (thêm/sửa/xóa)',
        'Theo dõi toàn bộ đơn hàng hệ thống',
        'Quản lý khuyến mãi toàn hệ thống',
        'Thống kê chi tiết doanh thu, người dùng',
        'Quản lý loại hàng hóa, sản phẩm'
      ]
    },
    {
      id: 'brand',
      name: 'Nhãn hàng',
      icon: <FaWarehouse />,
      color: '#4ECDC4',
      features: [
        'Quản lý sản phẩm và tồn kho',
        'Xử lý đơn hàng từ nhà bán lẻ',
        'Tạo khuyến mãi riêng cho cửa hàng',
        'Thống kê doanh thu và đơn hàng',
        'Quản lý loại hàng hóa của mình'
      ]
    },
    {
      id: 'retailer',
      name: 'Nhà bán lẻ',
      icon: <FaStore />,
      color: '#45B7D1',
      features: [
        'Tìm kiếm và đặt hàng từ nhãn hàng',
        'Theo dõi đơn hàng thời gian thực',
        'Áp dụng voucher giảm giá',
        'Quản lý giỏ hàng và đơn hàng',
        'Xác nhận nhận hàng khi giao thành công'
      ]
    },
    {
      id: 'shipper',
      name: 'Nhân viên giao hàng',
      icon: <MdLocalShipping />,
      color: '#96CEB4',
      features: [
        'Nhận và quản lý đơn giao hàng',
        'Cập nhật trạng thái giao hàng thời gian thực',
        'Xem lịch sử giao hàng',
        'Tự chọn đơn hàng phù hợp khu vực',
        'Xem chi tiết thông tin giao nhận'
      ]
    }
  ];

  const shippingTypes = [
    {
      type: 'Thông thường (xe máy)',
      vehicle: 'xe_may',
      description: '4km đầu: 25.000đ, các km tiếp: +4.000đ/km',
      max: 'Tối đa 50kg',
      icon: '🛵',
      color: '#FFD166'
    },
    {
      type: 'Hàng nặng (xe máy)',
      vehicle: 'xe_may',
      description: '4km đầu: 38.000đ, các km tiếp: +6.000đ/km',
      max: 'Tối đa 50kg',
      icon: '⚡',
      color: '#06D6A0'
    },
    {
      type: 'Dễ vỡ (xe máy)',
      vehicle: 'xe_may',
      description: '4km đầu: 25.000đ, các km tiếp: +5.500đ/km',
      max: 'Tối đa 50kg',
      icon: '🎯',
      color: '#118AB2'
    },
    {
      type: 'Thông thường (xe tải)',
      vehicle: 'xe_tai',
      description: '2km đầu: 150.000đ, 2-10km: +7.000đ/km',
      max: 'Tối đa 900kg',
      icon: '🚚',
      color: '#073B4C'
    },
    {
      type: 'Đông lạnh (xe tải)',
      vehicle: 'xe_tai',
      description: '2km đầu: 200.000đ, 2-10km: +10.000đ/km',
      max: 'Tối đa 900kg',
      icon: '❄️',
      color: '#EF476F'
    },
    {
      type: 'Dễ vỡ (xe tải)',
      vehicle: 'xe_tai',
      description: '2km đầu: 150.000đ, 2-10km: +7.000đ/km',
      max: 'Tối đa 900kg',
      icon: '🎁',
      color: '#7209B7'
    }
  ];

  const stats = [
    { number: '4', label: 'Vai trò', icon: '👥' },
    { number: '6', label: 'Loại vận chuyển', icon: '🚚' },
    { number: '99%', label: 'Giao hàng thành công', icon: '✅' },
    { number: '24/7', label: 'Hỗ trợ', icon: '🕒' }
  ];

  return (
    <Layout showSearch={false}>
      <div className={styles.homeContainer}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>🚀 HỆ THỐNG LOGISTICS</div>
            <h1 className={styles.heroTitle}>
              Kết nối <span className={styles.highlight}>Nhà sản xuất</span> & <span className={styles.highlight}>Nhà bán lẻ</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Giải pháp logistics thông minh cho TP.HCM. Tối ưu hóa chuỗi cung ứng với công nghệ hiện đại, 
              kết nối trực tiếp nhà sản xuất với các đại lý bán lẻ.
            </p>
            <div className={styles.heroButtons}>
              <a href="/register" className={`${styles.btn} ${styles.primaryBtn}`}>
                <FaUserShield /> Đăng ký ngay
              </a>
              <a href="/login" className={`${styles.btn} ${styles.secondaryBtn}`}>
                <FaUserShield /> Đăng nhập
              </a>
            </div>
          </div>
        </section>
        {/* Slider Section - Thiết kế tươi sáng */}
        <section className={styles.sliderSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tại sao chọn chúng tôi?</h2>
            <p className={styles.sectionSubtitle}>Những tính năng nổi bật của hệ thống logistics thông minh</p>
          </div>
          
          <div className={styles.sliderContainer} ref={sliderRef}>
            <div 
              className={styles.sliderTrack} 
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide) => (
                <div key={slide.id} className={styles.slide}>
                  <div 
                    className={styles.slideContent}
                    style={{ background: slide.color }}
                  >
                    <div className={styles.slideIcon} style={{ color: slide.accentColor }}>
                      {slide.icon}
                    </div>
                    <h2 className={styles.slideTitle}>{slide.title}</h2>
                    <p className={styles.slideDescription}>{slide.description}</p>
                    <div className={styles.slideDecoration}>
                      <div className={styles.decorationCircle} style={{ backgroundColor: `${slide.accentColor}20` }}></div>
                      <div className={styles.decorationCircle} style={{ backgroundColor: `${slide.accentColor}15` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className={`${styles.sliderBtn} ${styles.prevBtn}`} onClick={prevSlide}>
              <FaChevronLeft />
            </button>
            <button className={`${styles.sliderBtn} ${styles.nextBtn}`} onClick={nextSlide}>
              <FaChevronRight />
            </button>
            
            <div className={styles.sliderDots}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${currentSlide === index ? styles.active : ''}`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section - Thiết kế hiện đại */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className={styles.statNumber}>{stat.number}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section - Màu sắc tươi sáng */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tính năng nổi bật</h2>
            <p className={styles.sectionSubtitle}>Khám phá những công nghệ tiên tiến giúp tối ưu hóa quy trình logistics</p>
          </div>
          <div className={styles.featuresGrid}>
            {systemFeatures.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIconWrapper} style={{ color: feature.color }}>
                  <div className={styles.featureIcon} style={{ backgroundColor: `${feature.color}15` }}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles Section - Tabs đẹp */}
        <section className={styles.rolesSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Vai trò trong hệ thống</h2>
            <p className={styles.sectionSubtitle}>Mỗi vai trò có chức năng và quyền hạn riêng biệt</p>
          </div>
          
          <div className={styles.roleTabs}>
            {roles.map((role) => (
              <button
                key={role.id}
                className={`${styles.roleTab} ${activeRole === role.id ? styles.active : ''}`}
                onClick={() => setActiveRole(role.id)}
                style={{ 
                  backgroundColor: activeRole === role.id ? `${role.color}15` : '#f8fafc',
                  color: activeRole === role.id ? role.color : '#64748b'
                }}
              >
                <div className={styles.roleTabIcon} style={{ color: role.color }}>
                  {role.icon}
                </div>
                <span>{role.name}</span>
              </button>
            ))}
          </div>

          <div className={styles.roleContent}>
            {roles
              .filter(role => role.id === activeRole)
              .map((role) => (
                <div key={role.id} className={styles.roleDetail}>
                  <div className={styles.roleHeader}>
                    <div className={styles.roleDetailIcon} style={{ backgroundColor: `${role.color}15`, color: role.color }}>
                      {role.icon}
                    </div>
                    <div>
                      <h3 className={styles.roleDetailTitle}>{role.name}</h3>
                      <p className={styles.roleDetailSubtitle}>
                        {role.id === 'admin' && 'Quản lý toàn bộ hệ thống, người dùng và dữ liệu'}
                        {role.id === 'brand' && 'Quản lý sản phẩm, kho hàng và đơn hàng từ nhà bán lẻ'}
                        {role.id === 'retailer' && 'Đặt hàng, theo dõi vận chuyển và quản lý giao dịch'}
                        {role.id === 'shipper' && 'Nhận và thực hiện giao hàng, cập nhật trạng thái thời gian thực'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.roleFeatures}>
                    <h4>Chức năng chính:</h4>
                    <ul>
                      {role.features.map((feature, index) => (
                        <li key={index}>
                          <span className={styles.featureBullet} style={{ backgroundColor: role.color }}></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Shipping Types - Thiết kế bắt mắt */}
        <section className={styles.shippingSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Loại hình vận chuyển</h2>
            <p className={styles.sectionSubtitle}>Hệ thống tự động chọn phương án tối ưu dựa trên đặc tính hàng hóa</p>
          </div>
          
          <div className={styles.shippingGrid}>
            {shippingTypes.map((type, index) => (
              <div key={index} className={styles.shippingCard} style={{ borderTop: `4px solid ${type.color}` }}>
                <div className={styles.shippingHeader}>
                  <div className={styles.shippingIcon}>{type.icon}</div>
                  <div className={styles.shippingType}>{type.type}</div>
                </div>
                <p className={styles.shippingDescription}>{type.description}</p>
                <div className={styles.shippingLimits}>
                  <span style={{ color: type.color }}>{type.max}</span>
                </div>
                <div className={styles.vehicleBadge}>
                  {type.vehicle === 'xe_may' ? '🛵 Xe máy' : '🚚 Xe tải'}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Process Flow - Timeline đẹp */}
        <section className={styles.processSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quy trình hoạt động</h2>
            <p className={styles.sectionSubtitle}>Từ đặt hàng đến giao hàng chỉ với 5 bước đơn giản</p>
          </div>
          
          <div className={styles.processSteps}>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <div className={styles.stepIcon}>🛒</div>
                <h3>Nhà bán lẻ đặt hàng</h3>
                <p>Chọn sản phẩm từ nhãn hàng, áp dụng voucher và xác nhận đơn hàng</p>
              </div>
            </div>
            
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <div className={styles.stepIcon}>✅</div>
                <h3>Nhãn hàng xác nhận</h3>
                <p>Kiểm tra tồn kho và xác nhận hoặc từ chối đơn hàng</p>
              </div>
            </div>
            
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <div className={styles.stepIcon}>💰</div>
                <h3>Hệ thống tính phí</h3>
                <p>Tự động tính phí vận chuyển dựa trên khoảng cách, trọng lượng và loại hàng</p>
              </div>
            </div>
            
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <div className={styles.stepIcon}>🚚</div>
                <h3>Nhân viên giao hàng</h3>
                <p>Nhận đơn, cập nhật trạng thái và giao hàng đến nhà bán lẻ</p>
              </div>
            </div>
            
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>5</div>
              <div className={styles.stepContent}>
                <div className={styles.stepIcon}>🎉</div>
                <h3>Hoàn tất giao dịch</h3>
                <p>Nhà bán lẻ xác nhận nhận hàng, hệ thống cập nhật trạng thái hoàn tất</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <div className={styles.ctaIcon}>🚀</div>
            <h2>Sẵn sàng tối ưu hóa chuỗi cung ứng?</h2>
            <p>Tham gia ngay hệ thống logistics thông minh dành riêng cho khu vực TP.HCM</p>
            <div className={styles.ctaButtons}>
              <a href="/register" className={`${styles.btn} ${styles.primaryBtn}`}>
                <FaUserShield /> Đăng ký miễn phí
              </a>
              <a href="/contact" className={`${styles.btn} ${styles.outlineBtn}`}>
                📞 Liên hệ tư vấn
              </a>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}