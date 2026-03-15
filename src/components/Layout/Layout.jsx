import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import styles from './Layout.module.scss';

function Layout({ 
  children,
  showSearch = false,
  searchQuery = '',
  onSearchChange = null,
  cartCount = 0,
  onCartClick = null,
  showFooter = true
}) {
  return (
    <div className={styles.layout}>
      <Header 
        showSearch={showSearch}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        cartCount={cartCount}
        onCartClick={onCartClick}
      />
      
      <main className={styles.mainContent}>
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}

export default Layout;