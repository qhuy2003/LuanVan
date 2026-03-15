<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Product;
use App\Models\Brand;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
class BrandController extends Controller
{
    public function index()
{
    $brands = User::where('role', 'brand')
        ->select('user_id', 'full_name', 'role')
        ->get();
    return response()->json($brands);
}

public function show($brandId)
    {
        try {
            $brand = Brand::where('brand_id', $brandId)
                ->select('brand_id', 'brand_name', 'warehouse_lat', 'warehouse_lng', 'warehouse_address')
                ->first();
            
            if (!$brand) {
                return response()->json(['error' => 'Brand not found'], 404);
            }
            
            return response()->json($brand);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function checkWarehouseAddress()
{
    $user = Auth::user();

    if ($user->role !== 'brand') {
        return response()->json(['has_address' => false], 403);
    }

    $brand = $user->brand; // Relation brand() trong User model

    $hasAddress = $brand && !empty($brand->warehouse_address);

    return response()->json([
        'has_address' => $hasAddress,
        'message' => $hasAddress ? 'OK' : 'Vui lòng cập nhật địa chỉ kho hàng'
    ]);
}
public function BrandstatsOverview(Request $request)
{
    $user = Auth::user();

    // Kiểm tra user có phải brand không
    if (!$user || $user->role !== 'brand') {
        return response()->json(['message' => 'Unauthorized - Chỉ brand mới truy cập được'], 401);
    }

    // Lấy brand của user hiện tại (giả sử model User có relation 'brand')
    $brand = $user->brand; 

    if (!$brand) {
        return response()->json(['message' => 'Không tìm thấy thông tin nhãn hàng'], 404);
    }

    $year = $request->query('year', date('Y'));

    // SẢN PHẨM MỚI THEO THÁNG 
    $productsByMonthRaw = Product::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
        ->where('brand_id', $brand->brand_id) // ← Chỉ sản phẩm của brand này
        ->whereYear('created_at', $year)
        ->groupBy('month')
        ->orderBy('month')
        ->pluck('count', 'month')
        ->toArray();

    $months = range(1, 12);
    $productsData = array_map(fn($m) => $productsByMonthRaw[$m] ?? 0, $months);

    // DOANH THU THEO THÁNG
    $revenueByMonthRaw = Order::where('brand_id', $brand->brand_id)
        ->whereIn('status', ['delivered', 'completed'])
        ->whereYear('order_date', $year)
        ->selectRaw('MONTH(order_date) as month, SUM(total_amount) as revenue')
        ->groupBy('month')
        ->pluck('revenue', 'month')
        ->toArray();

    $revenueByMonth = array_fill(0, 12, 0);
    foreach ($revenueByMonthRaw as $month => $revenue) {
        $revenueByMonth[$month - 1] = (float)$revenue;
    }

    // SỐ LƯỢNG ĐƠN HÀNG THEO THÁNG 
    $ordersByMonthRaw = Order::where('brand_id', $brand->brand_id)
        ->whereYear('order_date', $year)
        ->selectRaw('MONTH(order_date) as month, COUNT(*) as count')
        ->groupBy('month')
        ->pluck('count', 'month')
        ->toArray();

    $ordersByMonth = array_fill(0, 12, 0);
    foreach ($ordersByMonthRaw as $month => $count) {
        $ordersByMonth[$month - 1] = $count;
    }

    return response()->json([
        'year' => (int)$year,
        'total_products' => Product::where('brand_id', $brand->brand_id)
            ->whereYear('created_at', $year)
            ->count(),
        'products_by_month' => $productsData,
        'total_revenue' => array_sum($revenueByMonth),
        'revenue_by_month' => $revenueByMonth,
        'total_orders' => array_sum($ordersByMonth),
        'orders_by_month' => $ordersByMonth,
    ]);
}
}
