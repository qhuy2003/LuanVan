import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import styles from "./Login.module.scss";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Layout from "../../components/Layout/Layout";
function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  // Cập nhật dữ liệu khi người dùng nhập
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Gửi request đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("https://luanvan-production-4c74.up.railway.app/api/login", formData);

      // Lưu token và user info
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Đăng nhập thành công!", {
        position: "top-right",
        autoClose: 3000,
      });

      // Điều hướng dựa vào role
      const role = res.data.user.role;
      setTimeout(() => {
        switch(role) {
            case 'admin':
            navigate('/admin/products');
            break;
          case 'brand':
            navigate('/brand/products');
            break;
          case 'retailer':
            navigate('/retailer/dashboard');
            break;
          case 'shipper':
            navigate('/shipper/dashboard');
            break;
          default:
            navigate('/');
        }
      }, 1500);
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err.response?.data || err);
      const message =
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại!";
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <Layout showLoginBtn={false}>
    <div className={styles.loginPage}>
             
      <div className={styles.loginBox}>
        
        <h2>Đăng nhập</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <i className={`fa-solid fa-envelope ${styles.inputIcon}`}></i>
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.passwordGroup}>
            <i className={`fa-solid fa-lock ${styles.inputIcon}`}></i>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mật khẩu"
              required
              value={formData.password}
              onChange={handleChange}
            />
            <i
              className={`fa-solid ${
                showPassword ? "fa-eye-slash" : "fa-eye"
              } ${styles.eyeIcon}`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>

          <div className={styles.options}>
            <label>
              <input type="checkbox" /> Ghi nhớ tôi
            </label>
            {/* <Link to="/forgot-password">Quên mật khẩu?</Link> */}
          </div>

          <button  type="submit">Đăng nhập</button>
        </form>

        <p className={styles.registerLink}>
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
          </Layout>

  );
}

export default Login;
