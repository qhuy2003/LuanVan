<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
// 🔹 Đăng ký & đăng nhập
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/users/count', [UserController::class, 'countUsers']);

//san pham
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::middleware('auth:api')->group(function () {
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
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
            Route::get('dashboard', 'ShipperController@dashboard');
            Route::get('deliveries', 'DeliveryController@index');
            Route::put('deliveries/{id}/status', 'DeliveryController@updateStatus');
        });
    });

    // Common routes for all authenticated users
    Route::get('profile', 'AuthController@profile');
    Route::post('logout', 'AuthController@logout');
    
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