// src/pages/ProductDetail/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './ProductDetail.module.scss';
import { getProductById, getProducts } from '../../api/ProductApi'; 
import { addToCartApi } from '../../api/CartApi';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const [productDetail, allProducts] = await Promise.all([
        getProductById(id),
        getProducts()
      ]);

      setProduct(productDetail);

      // Lọc sản phẩm cùng nhãn hàng, còn hàng và đang hoạt động
      const similar = allProducts
        .filter(p => 
          Number(p.brand_id) === Number(productDetail.brand_id) &&
          p.product_id !== productDetail.product_id &&
          p.stock > 0 &&
          Boolean(p.is_active)
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);

      setSimilarProducts(similar);
    } catch (err) {
      toast.error('Không tải được sản phẩm');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCartApi(product.product_id, quantity);
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    } catch (err) {
      toast.error('Không thể thêm vào giỏ');
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h2>❌ Không tìm thấy sản phẩm</h2>
        <button onClick={() => navigate(-1)}>← Quay lại</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/retailer/dashboard')} > ← Quay lại </button>
      <div className={styles.main}>
        {/* Ảnh sản phẩm */}
        <div className={styles.imageSection}>
          <div className={styles.mainImage}>
            <img 
              src={product.image_url || 'https://via.placeholder.com/500?text=No+Image'} 
              alt={product.product_name}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/500?text=Image+Not+Found';
              }}
            />
          </div>
        </div>

        {/* Thông tin sản phẩm */}
        <div className={styles.infoSection}>
          <h1 className={styles.name}>{product.product_name}</h1>
          
          {/* {product.brand && (
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>{product.brand.brand_name}</span>
            </div>
          )} */}
          
          <div className={styles.priceSection}>
            <span className={styles.price}>
              {Number(product.price).toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className={styles.details}>
            <p><strong>Danh mục:</strong> {product.category?.category_name || 'Chưa có'}</p>
            <p><strong>Tồn kho:</strong> <span className={styles.stock}>{product.stock}</span></p>
            <p><strong>Trọng lượng:</strong> {product.weight_kg || 0} kg</p>
            <p><strong>Thể tích:</strong> {product.volume_m3 || 0} m³</p>
            <p><strong>Loại vận chuyển:</strong> {product.shipping_type?.name || 'Thông thường'}</p>
          </div>

          {product.description && (
            <div className={styles.description}>
              <h3>Mô tả sản phẩm</h3>
              <p>{product.description}</p>
            </div>
          )}

          {/* Số lượng & Thêm vào giỏ */}
          <div className={styles.actionSection}>
            <div className={styles.quantity}>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, Math.min(val, product.stock)));
                }}
                min="1"
                max={product.stock}
              />
              <button 
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>

            <button 
              onClick={handleAddToCart}
              className={styles.addToCartBtn}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? '❌ Hết hàng' : '🛒 Thêm vào giỏ hàng'}
            </button>

            <button 
              onClick={() => navigate('/cart')}
              className={styles.goToCartBtn}
            >
              🛍️ Xem giỏ hàng
            </button>
          </div>
        </div>
      </div>

      {/* Sản phẩm cùng nhãn hàng */}
      {similarProducts.length > 0 && (
        <div className={styles.similarSection}>
          <h2 className={styles.similarTitle}>
            Sản phẩm khác của {product.brand?.brand_name || 'nhãn hàng này'}
          </h2>
          <div className={styles.similarGrid}>
            {similarProducts.map(p => (
              <div 
                key={p.product_id} 
                className={styles.similarCard}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  navigate(`/productdetail/${p.product_id}`);
                }}
              >
                <div className={styles.similarImage}>
                  <img 
                    src={p.image_url || 'https://via.placeholder.com/200?text=No+Image'} 
                    alt={p.product_name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200?text=No+Image';
                    }}
                  />
                </div>
                <div className={styles.similarInfo}>
                  <h4>{p.product_name}</h4>
                  <p className={styles.similarPrice}>
                    {Number(p.price).toLocaleString('vi-VN')}đ
                  </p>
                  <p className={styles.similarStock}>
                    Còn {p.stock} sản phẩm
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nếu không có sản phẩm cùng nhãn hàng */}
      {similarProducts.length === 0 && (
        <div className={styles.noSimilar}>
          <p>📭 Không có sản phẩm nào khác từ nhãn hàng này</p>
        </div>
      )}
    </div>
  );    
}

export default ProductDetail;