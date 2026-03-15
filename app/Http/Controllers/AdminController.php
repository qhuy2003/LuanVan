<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\OrderItem;
class AdminController extends Controller
{

public function getStats(Request $request)
{
    $year = $request->query('year', date('Y'));

    // Doanh thu theo tháng
    $revenueByMonthRaw = Order::selectRaw('MONTH(order_date) as month, SUM(total_amount) as revenue')
        ->whereIn('status', ['delivered', 'completed'])
        ->whereYear('order_date', $year)
        ->groupBy('month')
        ->pluck('revenue', 'month')
        ->toArray();

    $revenueByMonth = array_fill(0, 12, 0);
    foreach ($revenueByMonthRaw as $month => $revenue) {
        $revenueByMonth[$month - 1] = (float)$revenue;
    }

    // Người dùng theo tháng
    $usersByMonthRaw = User::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
        ->whereYear('created_at', $year)
        ->groupBy('month')
        ->pluck('count', 'month')
        ->toArray();

    $usersByMonth = array_fill(0, 12, 0);
    foreach ($usersByMonthRaw as $month => $count) {
        $usersByMonth[$month - 1] = $count;
    }

    // Sản phẩm theo tháng
    $productsByMonthRaw = Product::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
        ->whereYear('created_at', $year)
        ->groupBy('month')
        ->pluck('count', 'month')
        ->toArray();

    $productsByMonth = array_fill(0, 12, 0);
    foreach ($productsByMonthRaw as $month => $count) {
        $productsByMonth[$month - 1] = $count;
    }
    $ordersByMonthRaw = Order::selectRaw('MONTH(order_date) as month, COUNT(*) as count')
        ->whereYear('order_date', $year)
        ->groupBy('month')
        ->pluck('count', 'month')
        ->toArray();

    $ordersByMonth = array_fill(0, 12, 0);
    foreach ($ordersByMonthRaw as $month => $count) {
        $ordersByMonth[$month - 1] = $count;
    }

    // Tổng đơn hàng
    $totalOrders = Order::count();

    // Đơn theo trạng thái
    $ordersByStatus = Order::selectRaw('status, count(*) as count')
        ->groupBy('status')
        ->pluck('count', 'status');
    // Trả về tất cả
    return response()->json([
        'year' => (int)$year,
        'total_revenue' => array_sum($revenueByMonth),
        'revenue_by_month' => $revenueByMonth,
        'total_users' => User::whereYear('created_at', $year)->count(),
        'users_by_month' => $usersByMonth,
        'total_products' => Product::whereYear('created_at', $year)->count(),
        'products_by_month' => $productsByMonth,
        'total_orders' => $totalOrders,
        'orders_by_month' => $ordersByMonth, // ← MỚI: đơn theo tháng
        'orders_by_status' => $ordersByStatus,
        
        // Thêm các thống kê khác nếu cần
    ]);
}
}
