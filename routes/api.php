<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\ShipperController;
use App\Models\ShippingType;
use App\Models\User;

// 🔹 Đăng ký & đăng nhập
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/users/count', [UserController::class, 'countUsers']);

// 🔹 Categories
Route::get('/categories', [CategoriesController::class, 'index']);
Route::get('/categories/{id}', [CategoriesController::class, 'show']);

// 🔹 Shipping Types
Route::get('/shipping-types', function () {
    $types = ShippingType::all();
    return response()->json($types);
});

// 🔹 Brands
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/brands/{id}', [BrandController::class, 'show']);

//san pham
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::middleware('auth:api')->group(function () {
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    
    // 🛒 Cart routes
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/add', [CartController::class, 'store']);
    Route::put('/cart/update/{productId}', [CartController::class, 'update']);
    Route::delete('/cart/remove/{productId}', [CartController::class, 'remove']);
    Route::delete('/cart/clear', [CartController::class, 'clear']);
    
    // 📋 Categories (mutations)
    Route::post('/categories', [CategoriesController::class, 'store']);
    Route::put('/categories/{id}', [CategoriesController::class, 'update']);
    Route::delete('/categories/{id}', [CategoriesController::class, 'destroy']);
    
    // 📦 Orders
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/admin/orders', [OrderController::class, 'index']);
    Route::patch('/admin/orders/{orderId}/waiting-pickup', [OrderController::class, 'transferToWaitingPickup']);
    Route::get('/brand/orders', [OrderController::class, 'index']);
    Route::patch('/brand/orders/{orderId}/confirm', [OrderController::class, 'confirm']);
    Route::patch('/brand/orders/{orderId}/reject', [OrderController::class, 'reject']);
    Route::get('/retailer/orders', [OrderController::class, 'retailerOrders']);
    Route::post('/retailer/orders/{orderId}/complete', [OrderController::class, 'completeOrder']);
    Route::post('/retailer/orders/{orderId}/cancel', [OrderController::class, 'cancelOrder']);
    Route::post('/retailer/orders/{orderId}/refund', [OrderController::class, 'cancelAndRefund']);
    
    // 🎁 Promotions
    Route::get('/promotions', [PromotionController::class, 'index']);
    Route::post('/promotions', [PromotionController::class, 'store']);
    Route::put('/promotions/{id}', [PromotionController::class, 'update']);
    Route::delete('/promotions/{id}', [PromotionController::class, 'destroy']);
    Route::patch('/promotions/{id}/toggle', [PromotionController::class, 'toggleActive']);
    Route::get('/promotions/public', [PromotionController::class, 'publicIndex']);
    Route::get('/promotions/brand/{brandId}', [PromotionController::class, 'publicIndexBrand']);
    Route::post('/vouchers/apply', [PromotionController::class, 'apply']);
    
    // 👤 Profile
    Route::get('/me', [AuthController::class, 'profile']);
    Route::post('/me', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'changePassword']);
});
// 🔹 Lấy thông tin người dùng (chỉ cho người đã đăng nhập bằng JWT)
Route::middleware('jwt.auth')->group(function () {
    // Supplier/Brand routes
    Route::middleware('check.role:supplier')->group(function () {
        Route::prefix('supplier')->group(function () {
            Route::get('dashboard', 'SupplierController@dashboard');
            Route::resource('products', 'ProductController');
            Route::get('orders', 'OrderController@supplierOrders');
        });
    });

    // Retailer routes
    Route::middleware('check.role:retailer')->group(function () {
        Route::prefix('retailer')->group(function () {
            Route::get('dashboard', 'RetailerController@dashboard');
            Route::get('products', 'ProductController@index');
            Route::resource('orders', 'OrderController');
        });
    });

    // Shipper routes
    Route::middleware('check.role:shipper')->group(function () {
        Route::prefix('shipper')->group(function () {
            Route::get('dashboard', [ShipperController::class, 'dashboard']);
            Route::post('orders/{orderId}/accept', [ShipperController::class, 'acceptOrder']);
            Route::post('orders/{orderId}/status', [ShipperController::class, 'updateOrderStatus']);
            Route::get('deliveries', 'DeliveryController@index');
            Route::put('deliveries/{id}/status', 'DeliveryController@updateStatus');
        });
    });

    // Common routes for all authenticated users
    Route::get('/me', [AuthController::class, 'profile']);
    Route::post('/me', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'changePassword']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Brand routes
    Route::prefix('brand')->group(function () {
        Route::get('check-warehouse', [BrandController::class, 'checkWarehouseAddress']);
    });
    
    // Admin: đếm tổng user (kiểm tra role trực tiếp để tránh phụ thuộc middleware chưa đăng ký)
    Route::get('admin/users/count', function () {
        $user = auth()->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $count = User::count();
        return response()->json(['count' => $count]);
    });
});