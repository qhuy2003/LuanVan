<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderStatusLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ShipperController extends Controller
{
    // Dashboard: Danh sách đơn hàng có thể nhận
    public function dashboard()
    {
        $user = Auth::user();
        
        // ✅ Kiểm tra user đã đăng nhập
        if (!$user) {
            return response()->json(['error' => 'Chưa đăng nhập'], 401);
        }

        // ✅ Kiểm tra user có shipper profile
        $shipper = $user->shipper;
        if (!$shipper) {
            return response()->json(['error' => 'Không tìm thấy thông tin shipper'], 404);
        }

        Log::info('Shipper dashboard loaded', [
            'user_id' => $user->user_id,
            'shipper_id' => $shipper->shipper_id
        ]);

        // ✅ Đơn hàng đang chờ lấy hàng (chưa có shipper)
        $availableOrders = Order::with([
                'brand', 
                'retailer', 
                'items.product',
                'items.product.brand',
                'items.product.shippingType'
            ])
            ->whereIn('status', ['confirmed', 'waiting_pickup'])
            ->where(function($query) {
                $query->whereNull('shipper_id')
                      ->orWhere('shipper_id', 0); // ← Xử lý cả trường hợp shipper_id = 0
            })
            ->orderBy('order_date', 'desc')
            ->get();

        Log::info('Available orders count: ' . $availableOrders->count());

        // ✅ Đơn hàng đang giao của shipper này
        $myCurrentOrders = Order::with([
                'brand', 
                'retailer', 
                'items.product',
                'items.product.brand',
                'items.product.shippingType'
            ])
            ->where('shipper_id', $shipper->shipper_id)
            ->where('status', 'shipping')
            ->orderBy('updated_at', 'desc')
            ->get();

        // ✅ Lịch sử giao hàng
        $history = Order::with(['brand', 'retailer', 'items.product'])
            ->where('shipper_id', $shipper->shipper_id)
            ->whereIn('status', ['delivered', 'completed', 'cancelled'])
            ->orderBy('updated_at', 'desc')
            ->take(20)
            ->get();

        return response()->json([
            'available_orders' => $availableOrders,
            'current_orders' => $myCurrentOrders,
            'history' => $history,
            'shipper_status' => $shipper->status ?? 'active'
        ]);
    }

    // Nhận đơn hàng
    public function acceptOrder($orderId)
    {
        $user = Auth::user();
        $shipper = $user->shipper;

        if (!$shipper) {
            return response()->json(['error' => 'Không tìm thấy thông tin shipper'], 404);
        }

        // ✅ Tìm đơn hàng chưa có shipper
        $order = Order::whereIn('status', ['confirmed', 'waiting_pickup'])
            ->where(function($query) {
                $query->whereNull('shipper_id')
                      ->orWhere('shipper_id', 0);
            })
            ->findOrFail($orderId);

        // ✅ Gán shipper và cập nhật trạng thái
        $order->shipper_id = $shipper->shipper_id;
        $order->status = 'shipping';
        $order->save();

        // ✅ Log lịch sử
        OrderStatusLog::create([
            'order_id' => $order->order_id,
            'status' => 'shipping',
            'note' => "Shipper {$shipper->shipper_id} đã nhận đơn và đang giao hàng"
        ]);

        Log::info('Order accepted', [
            'order_id' => $orderId,
            'shipper_id' => $shipper->shipper_id
        ]);

        return response()->json([
            'message' => 'Nhận đơn thành công', 
            'order' => $order->load(['brand', 'retailer', 'items.product'])
        ]);
    }

    // Cập nhật trạng thái đơn hàng
    public function updateOrderStatus(Request $request, $orderId)
    {
        $request->validate([
            'status' => 'required|in:delivered,failed',
            'note' => 'nullable|string|max:500'
        ]);

        $user = Auth::user();
        $shipper = $user->shipper;

        if (!$shipper) {
            return response()->json(['error' => 'Không tìm thấy thông tin shipper'], 404);
        }

        // ✅ Chỉ cập nhật đơn của shipper này
        $order = Order::where('shipper_id', $shipper->shipper_id)
            ->where('status', 'shipping')
            ->findOrFail($orderId);

        $newStatus = $request->status === 'delivered' ? 'delivered' : 'cancelled';

        $order->status = $newStatus;
        $order->save();

        $note = $request->note ?? ($newStatus === 'delivered' ? 'Giao hàng thành công' : 'Giao hàng thất bại');

        OrderStatusLog::create([
            'order_id' => $order->order_id,
            'status' => $newStatus,
            'note' => $note
        ]);

        Log::info('Order status updated', [
            'order_id' => $orderId,
            'new_status' => $newStatus,
            'shipper_id' => $shipper->shipper_id
        ]);

        return response()->json(['message' => 'Cập nhật trạng thái thành công']);
    }
}