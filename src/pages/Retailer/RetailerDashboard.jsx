import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import styles from './RetailerDashboard.module.scss';
import UserMenu from '../../components/UserMenu/UserMenu';
import Layout from '../../components/Layout/Layout';

import { 
  getCart, 
  addToCartApi, 
  updateCartItemApi, 
  removeFromCartApi, 
  clearCartApi 
} from '../../api/CartApi';
import { getProductsRetailer} from '../../api/ProductApi';
import { getCategories } from '../../api/CategoriesApi';
import { createOrder } from '../../api/OrderApi';

function RetailerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
 
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [showCart, setShowCart] = useState(false);

  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [distance, setDistance] = useState(null);
  const [shippingFee, setShippingFee] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const mapRef = useRef();

useEffect(() => {
  const userData = localStorage.getItem('user');
  if (!userData) {
    toast.error('Vui lòng đăng nhập!');
    navigate('/login');
    return;
  }

  const user = JSON.parse(userData);
  if (user.role !== 'retailer') {
    toast.error('Chỉ nhà bán lẻ mới truy cập được!');
    navigate('/login');
    return;
  }

  // Load tất cả data
  const init = async () => {
    await Promise.all([
      loadProducts(),
      loadCategories(),
      loadCartFromDB()
    ]);
  };

  init();
}, [navigate]); // chỉ phụ thuộc navigate

  const loadProducts = async () => {
    try {
      const data = await getProductsRetailer();
      const inStock = data.filter(p => p.stock > 0);
      setProducts(inStock);
      setFilteredProducts(inStock);
    } catch (err) {
      toast.error('Không tải được sản phẩm');
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Lỗi tải danh mục');
    }
  };

  const loadCartFromDB = async () => {
    try {
      const data = await getCart();
      setCart(data.items || []);
      setCartCount(data.items?.reduce((sum, i) => sum + i.quantity, 0) || 0);
    } catch (err) {
      console.error('Lỗi tải giỏ hàng:', err);
    }
  };

  const getUniqueBrands = () => {
  const brandMap = {};
  products.forEach(p => {
    if (p.brand && p.brand.brand_id) {
      brandMap[p.brand.brand_id] = p.brand;
    }
  });
  return Object.values(brandMap);
};

const brands = getUniqueBrands();

  // Lọc sản phẩm theo danh mục
  const handleFilter = (type, id) => {
    if (type === 'category') {
      setSelectedCategory(id);
      setSelectedBrand(null);
    } else if (type === 'brand') {
      setSelectedBrand(id);
      setSelectedCategory(null);
    }

    if (!id) {
      setFilteredProducts(products);
      return;
    }

    if (type === 'category') {
      setFilteredProducts(products.filter(p => p.category_id === id));
    } else if (type === 'brand') {
      setFilteredProducts(products.filter(p => p.brand?.brand_id === id));
    }
  };

  const addToCart = async (product) => {
    try {
      await addToCartApi(product.product_id, 1);
      loadCartFromDB();
    } catch (err) {
      toast.error('Không thể thêm vào giỏ');
    }
  };
const handleSearch = async (query) => {
  setSearchQuery(query);

  if (!query.trim()) {
    setSearchResults([]);
    setFilteredProducts(products); // Hiển thị lại danh sách theo danh mục nếu có
    return;
  }

  // Tìm kiếm không phân biệt hoa thường, có dấu
  const normalize = (str) => str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  const normalizedQuery = normalize(query);

  const results = products.filter(p =>
    normalize(p.product_name).includes(normalizedQuery)
  );

  setSearchResults(results);
  setFilteredProducts(results); // Hiển thị kết quả tìm kiếm
};
  const updateQty = async (productId, qty) => {
    if (qty <= 0) {
      await removeFromCartApi(productId);
    } else {
      await updateCartItemApi(productId, qty);
    }
    loadCartFromDB();
  };

  const removeItem = async (productId) => {
    await removeFromCartApi(productId);
    loadCartFromDB();
    toast.success('Đã xóa khỏi giỏ hàng');
  };

  const getTotal = () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const getOrderShippingType = () => {
    if (cart.length === 0) return 1;
    let highest = 0;
    let typeId = 1;
    cart.forEach(i => {
      const prio = SHIPPING_PRIORITY[i.shipping_type_id] || 1;
      if (prio > highest) {
        highest = prio;
        typeId = i.shipping_type_id;
      }
    });
    return typeId;
  };

  const searchAddress = async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const url = `https://maps.track-asia.com/api/v2/place/textsearch/json?key=${TRACK_ASIA_KEY}&query=${encodeURIComponent(query)}&new_admin=true&size=8`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const suggestions = data.results
          .filter(r => r.geometry?.location?.lat && r.geometry?.location?.lng)
          .map(r => ({
            label: r.formatted_address || r.name || 'Không rõ địa chỉ',
            lat: parseFloat(r.geometry.location.lat),
            lng: parseFloat(r.geometry.location.lng)
          }));

        setSuggestions(suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Lỗi tìm địa chỉ:', err);
      toast.error('Lỗi mạng khi tìm địa chỉ');
      setSuggestions([]);
    }
  };
  return (
       <Layout 
      showSearch={true}
      searchQuery={searchQuery}
      onSearchChange={(e) => handleSearch(e.target.value)}
      cartCount={cartCount}
    >
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.mainContent}>
        {/* Sidebar danh mục */}
        <aside className={styles.sidebar}>
            {/* Danh mục */}
            <div className={styles.filterSection}>
              <h3>Danh mục</h3>
              <ul className={styles.categoryList}>
                <li 
                  className={!selectedCategory && !selectedBrand ? styles.active : ''}
                  onClick={() => handleFilter(null, null)}
                >
                  <span>Tất cả</span>
                  <span className={styles.count}>({products.length})</span>
                </li>
                {categories.map(cat => {
                  const count = products.filter(p => p.category_id === cat.category_id).length;
                  return (
                    <li 
                      key={cat.category_id}
                      className={selectedCategory === cat.category_id ? styles.active : ''}
                      onClick={() => handleFilter('category', cat.category_id)}
                    >
                      <span>{cat.category_name}</span>
                      <span className={styles.count}>({count})</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Nhãn hàng */}
            <div className={styles.filterSection}>
              <h3>Nhãn hàng</h3>
              {brands.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic' }}>Không có nhãn hàng</p>
              ) : (
                <ul className={styles.categoryList}>
                  {brands.map(brand => {
                    const count = products.filter(p => p.brand?.brand_id === brand.brand_id).length;
                    return (
                      <li 
                        key={brand.brand_id}
                        className={selectedBrand === brand.brand_id ? styles.active : ''}
                        onClick={() => handleFilter('brand', brand.brand_id)}
                      >
                        <span>{brand.brand_name || 'Không tên'}</span>
                        <span className={styles.count}>({count})</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

        {/* Danh sách sản phẩm */}
        <div className={styles.productSection}>
          <div className={styles.filterInfo}>
              <p>
                {selectedBrand ? (
                  <>Nhãn hàng: <strong>{brands.find(b => b.brand_id === selectedBrand)?.brand_name}</strong> - Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm</>
                ) : selectedCategory ? (
                  <>Danh mục: <strong>{categories.find(c => c.category_id === selectedCategory)?.category_name}</strong> - Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm</>
                ) : (
                  <>Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm</>
                )}
              </p>
            </div>
          <div className={styles.productGrid}>
            {filteredProducts.map(p => (
              <div key={p.product_id} className={styles.productCard} onClick={()=>navigate(`/productdetail/${p.product_id}`)}>
                {p.image_url ? (
          <div className={styles.imageWrapper}>
            <img 
              src={p.image_url}
              alt={p.product_name} 
            />
                </div>
              ) : (
                  <div className={styles.imageWrapper}>
                  </div>
                )}
                <div className={styles.content}>
                  <h3>{p.product_name}</h3>
                  <p className={styles.price}>{Number(p.price).toLocaleString()}đ</p>
                   <p className={styles.price}>{Number(p.price).toLocaleString()/2}đ</p>

                  <p className={styles.stock}>Tồn kho: <strong>{p.stock}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    

     
    </div>
        </Layout>

  );
}

export default RetailerDashboard;