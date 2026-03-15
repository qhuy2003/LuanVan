// src/pages/Auth/Register.jsx
import { useState } from "react";
import styles from "./Register.module.scss";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { toast } from "react-toastify";
import { registerUser } from "../../api/UserApi";
import Layout from "../../components/Layout/Layout";
function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    // Bước 2 - thông tin theo role
    brand_name: "",
    // brand_address: "",
    brand_phone: "",
    store_name: "",
    // store_address: "",
    store_phone: "",
    id_card: "",
    license_plate: "",
    vehicle_type: "xe_may",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Bước 1 → Bước 2
  const handleNext = (e) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.password || !formData.role) {
      toast.warning("Vui lòng điền đầy đủ thông tin cơ bản!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.warning("Mật khẩu nhập lại không khớp!");
      return;
    }

    if (formData.password.length < 6) {
      toast.warning("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setStep(2);
  };

  // Gửi đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra bắt buộc theo role
    if (formData.role === "brand") {
      if (!formData.brand_name  || !formData.brand_phone) {
        toast.warning("Vui lòng nhập đầy đủ thông tin nhãn hàng!");
        return;
      }
    } else if (formData.role === "retailer") {
      if (!formData.store_name || !formData.store_phone) {
        toast.warning("Vui lòng nhập đầy đủ thông tin cửa hàng!");
        return;
      }
    } else if (formData.role === "shipper") {
      if (!formData.id_card || !formData.license_plate) {
        toast.warning("Vui lòng nhập CMND/CCCD và biển số xe!");
        return;
      }
    }

    try {
      // Payload đúng chuẩn với DB mới nhất
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,

        // Dữ liệu theo từng role – backend sẽ tạo bảng con tương ứng
        ...(formData.role === "brand" && {
          brand_name: formData.brand_name,
          // address: formData.brand_address,     // brands.address
          phone: formData.brand_phone,         // brands.phone
        }),

        ...(formData.role === "retailer" && {
          store_name: formData.store_name,
          // address: formData.store_address,     // retailers.address
          phone: formData.store_phone,         // retailers.phone
        }),

        ...(formData.role === "shipper" && {
          id_card: formData.id_card,
          license_plate: formData.license_plate,
          vehicle_type: formData.vehicle_type,
        }),
      };

      await registerUser(payload);
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      const msg = error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại!";
      toast.error(msg);
    }
  };

  return (
    <Layout>
    <div className={styles.registerPage}>
      <div className={styles.registerBox}>
        <h2>Đăng ký tài khoản</h2>

        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ""} ${step > 1 ? styles.completed : ""}`}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepLabel}>Thông tin cơ bản</div>
          </div>
          <div className={`${styles.stepConnector} ${step >= 2 ? styles.active : ""}`}></div>
          <div className={`${styles.step} ${step === 2 ? styles.active : ""}`}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepLabel}>
              {formData.role === "brand" ? "Thông tin nhãn hàng" :
               formData.role === "retailer" ? "Thông tin cửa hàng" :
               formData.role === "shipper" ? "Thông tin giao hàng" : "Thông tin bổ sung"}
            </div>
          </div>
        </div>

        <form onSubmit={step === 1 ? handleNext : handleSubmit}>
          {/* BƯỚC 1: Thông tin chung */}
          {step === 1 && (
            <>
              <div className={styles.inputGroup}>
                <i className="fa-solid fa-user"></i>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Họ và tên"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <i className="fa-solid fa-envelope"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.passwordGroup}>
                <i className="fa-solid fa-lock"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Mật khẩu"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <i
                  className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} ${styles.eyeIcon}`}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>

              <div className={styles.passwordGroup}>
                <i className="fa-solid fa-key"></i>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <i
                  className={`fa-solid ${showConfirm ? "fa-eye-slash" : "fa-eye"} ${styles.eyeIcon}`}
                  onClick={() => setShowConfirm(!showConfirm)}
                />
              </div>

              <div className={styles.inputGroup}>
                <i className="fa-solid fa-user-gear"></i>
                <select name="role" value={formData.role} onChange={handleChange} required>
                  <option value="">-- Chọn vai trò của bạn --</option>
                  <option value="brand">Tôi là Nhãn hàng (Brand)</option>
                  <option value="retailer">Tôi là Nhà bán lẻ</option>
                  <option value="shipper">Tôi là Shipper (Giao hàng)</option>
                </select>
              </div>

              <button type="submit">Tiếp tục →</button>
            </>
          )}

          {/* BƯỚC 2: Thông tin theo role */}
          {step === 2 && (
            <>
              <h3>
                {formData.role === "brand" && "Thông tin nhãn hàng"}
                {formData.role === "retailer" && "Thông tin cửa hàng"}
                {formData.role === "shipper" && "Thông tin giao hàng"}
              </h3>

              {/* Nhãn hàng */}
              {formData.role === "brand" && (
                <>
                  <div className={styles.inputGroup}>
                    <i className="fa-solid fa-building"></i>
                    <input
                      type="text"
                      name="brand_name"
                      placeholder="Tên nhãn hàng / công ty"
                      value={formData.brand_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {/* <div className={styles.inputGroup}>
                    <i className="fa-solid fa-map-marker-alt"></i>
                    <input
                      type="text"
                      name="brand_address"
                      placeholder="Địa chỉ kho / công ty"
                      value={formData.brand_address}
                      onChange={handleChange}
                      required
                    />
                  </div> */}
                  <div className={styles.inputGroup}>
                    <i className="fa-solid fa-phone"></i>
                    <input
                      type="text"
                      name="brand_phone"
                      placeholder="Số điện thoại liên hệ"
                      value={formData.brand_phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}

              {/* Nhà bán lẻ */}
              {formData.role === "retailer" && (
                <>
                  <div className={styles.inputGroup}>
                    <i className="fa-solid fa-store"></i>
                    <input
                      type="text"
                      name="store_name"
                      placeholder="Tên cửa hàng"
                      value={formData.store_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {/* <div className={styles.inputGroup}>
                    <i className="fa-solid fa-map-marker-alt"></i>
                    <input
                      type="text"
                      name="store_address"
                      placeholder="Địa chỉ cửa hàng"
                      value={formData.store_address}
                      onChange={handleChange}
                      required
                    />
                  </div> */}
                  <div className={styles.inputGroup}>
                    <i className="fa-solid fa-phone"></i>
                    <input
                      type="text"
                      name="store_phone"
                      placeholder="Số điện thoại cửa hàng"
                      value={formData.store_phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}

              {/* Shipper */}
              {formData.role === "shipper" && (
                <>
                  <div className={styles.inputGroup}>
                    <i className="fa-solid fa-id-card"></i>
                    <input
                      type="text"
                      name="id_card"
                      placeholder="Số CMND/CCCD"
                      value={formData.id_card}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <i className="fa-solid fa-motorcycle"></i>
                    <input
                      type="text"
                      name="license_plate"
                      placeholder="Biển số xe (VD: 59H1-12345)"
                      value={formData.license_plate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <i className="fa-solid fa-truck"></i>
                    <select
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      onChange={handleChange}
                    >
                      <option value="xe_may">Xe máy</option>
                      <option value="xe_tai">Xe tải</option>
                    </select>
                  </div>
                </>
              )}

              <div className={styles.btnGroup}>
                <button type="button" onClick={() => setStep(1)} className={styles.backBtn}>
                  ← Quay lại
                </button>
                <button type="submit">Hoàn tất đăng ký</button>
              </div>
            </>
          )}
        </form>

        <p className={styles.loginLink}>
          Đã có tài khoản? <a href="/login">Đăng nhập ngay</a>
        </p>
      </div>
    </div>
    </Layout>
  );
}

export default Register;