<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; 
use App\Models\OrderStatusLog;
use Illuminate\Support\Facades\Http;
class OrderController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $retailer = $user->retailer;

    $validated = $request->validate([
        'items' => 'required|array|min:1',
        'items.*.product_id' => 'required|exists:products,product_id',
        'items.*.quantity' => 'required|integer|min:1',
        'shipping_address' => 'required|string|max:500',
        'distance_km' => 'nullable|numeric|min:0',
        'note' => 'nullable|string',
        'promotion_id' => 'nullable|exists:promotions,promotion_id',
        'payment_method' => 'required|in:cod,bank_transfer,vnpay,zalopay',
        'shipping_fee' => 'required|numeric|min:0',
        'vnp_txn_ref' => 'nullable|string',
        'vnp_transaction_no' => 'nullable|string',
        'discount_amount' => 'nullable|numeric|min:0',
    ]);

    DB::beginTransaction();
    try {
        $cart = Cart::with('items.product')->where('retailer_id', $retailer->retailer_id)->firstOrFail();

        $totalAmount = 0;
        $brandId = null;
        $validItems = [];

        // Lọc items: bỏ sản phẩm ẩn, giữ sản phẩm còn hàng
        foreach ($validated['items'] as $item) {
            $product = Product::find($item['product_id']);
            if (!$product) {
                throw new \Exception('Sản phẩm không tồn tại');
            }

            // Bỏ qua sản phẩm ẩn 
            if (!$product->is_active) {
                continue;
            }

            if ($product->stock < $item['quantity']) {
                throw new \Exception("Sản phẩm {$product->product_name} không đủ tồn kho");
            }

            if ($brandId === null) {
                $brandId = $product->brand_id;
            } elseif ($brandId != $product->brand_id) {
                throw new \Exception('Chỉ được đặt hàng từ 1 nhãn hàng trong 1 đơn');
            }

            $validItems[] = $item;
            $totalAmount += $product->price * $item['quantity'];
        }

        // Nếu sau khi lọc không còn sản phẩm nào → lỗi
        if (empty($validItems)) {
            throw new \Exception('Tất cả sản phẩm trong đơn đã ngừng kinh doanh');
        }

        // Tính discount: Lấy từ frontend hoặc từ promotion_id
        $discountAmount = (float)($validated['discount_amount'] ?? 0);
        if (!$discountAmount && ($validated['promotion_id'] ?? null)) {
            // Logic tính discount từ promotion nếu cần
            $discountAmount = 0; // thay bằng logic thật nếu cần
        }

        $shippingFee = $validated['shipping_fee'];
        $finalAmount = $totalAmount - $discountAmount + $shippingFee;
        $paymentMethod = $validated['payment_method'];
        $paymentStatus = $paymentMethod === 'bank_transfer' ? 'pending' : 'paid';
        $paymentNote = $paymentMethod === 'bank_transfer' 
            ? 'Chờ Brand xác nhận thanh toán chuyển khoản VietQR' 
            : null;
        // Tạo đơn hàng
        $order = Order::create([
            'retailer_id' => $retailer->retailer_id,
            'brand_id' => $brandId,
            'promotion_id' => $validated['promotion_id'] ?? null,
            'discount_amount' => $discountAmount,
            'total_amount' => $finalAmount,
            'shipping_address' => $validated['shipping_address'],
            'distance_km' => $validated['distance_km'] ?? null,
            'note' => $validated['note'] ?? null,
            'status' => 'pending',
            'shipping_fee' => $shippingFee,
            'payment_method' => $paymentMethod,
            'payment_status' => ($request->payment_method === 'bank_transfer') ? 'pending' : 'paid',
            'payment_note' => $paymentNote,
            'vnp_txn_ref' => $validated['vnp_txn_ref'] ?? null,
            'vnp_transaction_no' => $validated['vnp_transaction_no'] ?? null,
        ]);
        

        // Tạo order items và giảm tồn kho
        foreach ($validItems as $item) {
            $product = Product::findOrFail($item['product_id']);

            OrderItem::create([
                'order_id' => $order->order_id,
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $product->price,
                'subtotal' => $product->price * $item['quantity'],
            ]);

            if ($paymentMethod !== 'bank_transfer') {
                $product->decrement('stock', $item['quantity']);
            }
        }

        // Xóa giỏ hàng
        CartItem::where('cart_id', $cart->cart_id)->delete();

        DB::commit();

        return response()->json([
            'message' => $paymentMethod === 'bank_transfer' 
                ? 'Đơn hàng đã được tạo! Vui lòng chuyển khoản để Brand xác nhận.'
                : 'Đặt hàng thành công!',
            'order_id' => $order->order_id,
            'payment_required' => $paymentMethod === 'bank_transfer'
        ], 201);

        } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'message' => $e->getMessage() ?: 'Đặt hàng thất bại, vui lòng thử lại'
        ], 400);
    }
}


    public function index()
    {   
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        Log::info('Brand orders request', [
            'user_id' => $user->user_id,
            'role' => $user->role,
            'brand_relation' => $user->brand?->toArray() ?? null,
        ]);

        $query = Order::with(['retailer', 'brand', 'items.product'])
                      ->orderBy('created_at', 'desc');

        if ($user->role === 'brand') {
            $brandId = $user->brand?->brand_id ?? $user->profile?->brand_id;
            $query->where('brand_id', $brandId);
        }

        $orders = $query->get();

        return response()->json(['orders' => $orders]);

    }

    // Admin chuyển trạng thái từ "confirmed" sang "waiting_pickup"
    public function transferToWaitingPickup($id)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Không có quyền'], 403);
        }

        $order = Order::findOrFail($id);

        if ($order->status !== 'confirmed') {
            return response()->json(['message' => 'Chỉ chuyển được từ trạng thái Đã xác nhận'], 400);
        }

        $order->status = 'waiting_pickup';
        $order->save();

        return response()->json([
            'message' => 'Chuyển sang Chờ lấy hàng thành công',
            'order' => $order
        ]);
    }
    public function confirm($id)
    {
        $user = Auth::user();

        if ($user->role !== 'brand') {
            return response()->json(['message' => 'Không có quyền'], 403);
        }

        $brandId = $user->brand?->brand_id ?? $user->profile?->brand_id;

        $order = Order::where('order_id', $id)
                      ->where('brand_id', $brandId)
                      ->firstOrFail();

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Chỉ xác nhận được đơn Chờ xác nhận'], 400);
        }

        $order->status = 'confirmed';
        $order->save();

        return response()->json([
            'message' => 'Xác nhận đơn hàng thành công',
            'order' => $order
        ]);
    }

    public function confirmPayment($orderId)
{
    $brand = Auth::user()->brand;

    $order = Order::with('items.product')
                  ->where('order_id', $orderId)
                  ->where('brand_id', $brand->brand_id)
                  ->firstOrFail();

    if ($order->payment_method !== 'bank_transfer') {
        return response()->json(['message' => 'Đơn này không yêu cầu xác nhận thanh toán'], 400);
    }

    if ($order->payment_status !== 'pending') {
        return response()->json(['message' => 'Đơn đã được xác nhận thanh toán'], 400);
    }

    foreach ($order->items as $item) {
        $product = $item->product;
        if ($product->stock < $item->quantity) {
            return response()->json(['message' => "Không đủ tồn kho cho sản phẩm {$product->product_name}"], 400);
        }
        $product->decrement('stock', $item->quantity);
    }
    $order->status = 'confirmed';
    $order->save();

   return response()->json(['message' => 'Xác nhận đơn hàng thành công']);
}

public function reject($id)
{
    $user = Auth::user();

    if ($user->role !== 'brand') {
        return response()->json(['message' => 'Không có quyền'], 403);
    }

    $brandId = $user->brand?->brand_id ?? $user->profile?->brand_id;

    $order = Order::where('order_id', $id)
                  ->where('brand_id', $brandId)
                  ->firstOrFail();

    if ($order->status !== 'pending') {
        return response()->json(['message' => 'Chỉ từ chối được đơn Chờ xác nhận'], 400);
    }

    $order->status = 'cancelled';
    $order->save();

    //  hoàn tồn kho nếu cần
    // foreach ($order->items as $item) {
    //     Product::where('product_id', $item->product_id)->increment('stock', $item->quantity);
    // }

    return response()->json([
        'message' => 'Từ chối đơn hàng thành công',
        'order' => $order
    ]);
}

// RetailerOrderController.php hoặc trong OrderController

public function retailerOrders(Request $request)
{
    $retailer = $request->user()->retailer;

    $orders = Order::with(['brand', 'items.product', 'shipper'])
        ->where('retailer_id', $retailer->retailer_id)
        ->orderBy('order_date', 'desc')
        ->get();

    return response()->json($orders);
}

public function completeOrder(Request $request, $orderId)
{
    $retailer = $request->user()->retailer;

    $order = Order::where('retailer_id', $retailer->retailer_id)
        ->where('status', 'delivered')
        ->findOrFail($orderId);

    $order->status = 'completed';
    $order->save();

    OrderStatusLog::create([
        'order_id' => $order->order_id,
        'status'   => 'completed',
        'note'     => 'Nhà bán lẻ đã xác nhận hoàn tất đơn hàng'
    ]);

    return response()->json(['message' => 'Đơn hàng đã hoàn tất thành công']);
}
public function cancelOrder(Request $request, $orderId)
{
    $retailer = $request->user()->retailer;

    $order = Order::where('retailer_id', $retailer->retailer_id)
        ->whereIn('status', ['pending', 'confirmed', 'waiting_pickup'])
        ->findOrFail($orderId);

    $order->status = 'cancelled';
    $order->save();
    foreach ($order->items as $item) {
        $product = $item->product;
        $product->increment('stock', $item->quantity);
    }
    OrderStatusLog::create([
        'order_id' => $order->order_id,
        'status'   => 'cancelled',
        'note'     => 'Nhà bán lẻ đã hủy đơn hàng'
    ]);

    return response()->json(['message' => 'Đơn hàng đã được hủy thành công']);
}


public function cancelAndRefund(Request $request, $orderId)
{
    $user = Auth::user();
    $retailer = $user->retailer;

    $order = Order::where('order_id', $orderId)
        ->where('retailer_id', $retailer->retailer_id)
        ->firstOrFail();

    if (!in_array($order->status, ['pending', 'confirmed', 'waiting_pickup', 'delivered'])) {
        return response()->json(['message' => 'Không thể hủy đơn hàng ở trạng thái hiện tại'], 400);
    }

    if ($order->payment_status === 'refunded') {
        return response()->json(['message' => 'Đơn hàng đã được hoàn tiền rồi, không thể hoàn lần 2'], 400);
    }

    // Luôn hoàn tồn kho trước
    foreach ($order->items as $item) {
        $product = $item->product;
        $product->increment('stock', $item->quantity);
    }

    if ($order->payment_method !== 'vnpay' || $order->payment_status !== 'paid') {
        $order->status = 'cancelled';
        $order->save();
        return response()->json(['message' => 'Đơn hàng đã được hủy']);
    }

    // Kiểm tra transaction data có đầy đủ không
    if (empty($order->vnp_transaction_no) || empty($order->vnp_txn_ref)) {
        Log::error('Missing VNPAY transaction data:', [
            'order_id' => $orderId,
            'vnp_txn_ref' => $order->vnp_txn_ref,
            'vnp_transaction_no' => $order->vnp_transaction_no
        ]);
        
        $order->status = 'cancelled';
        $order->save();
        
        return response()->json([
            'message' => 'Đơn hàng đã hủy nhưng không thể hoàn tiền VNPAY: thiếu thông tin giao dịch. Vui lòng liên hệ hỗ trợ.'
        ], 400);
    }

    // Refund VNPAY
    $vnp_TmnCode = config('vnpay.vnp_TmnCode');
    $vnp_HashSecret = config('vnpay.vnp_HashSecret');
    $vnp_apiUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";

    $vnp_TransactionNo = $order->vnp_transaction_no;
    if (empty($vnp_TransactionNo)) {
        return response()->json(['message' => 'Không thể hoàn tiền: thiếu mã giao dịch VNPAY (vnp_transaction_no)'], 400);
    }

    $vnp_RequestId = 'REF' . $order->order_id . time();
    $vnp_TxnRef = $order->vnp_txn_ref;
    if (empty($vnp_TxnRef)) {
        return response()->json(['message' => 'Không thể hoàn tiền: thiếu mã tham chiếu giao dịch VNPAY (vnp_txn_ref)'], 400);
    }

    $vnp_Amount = (int)round((float)$order->total_amount * 100);
    if ($vnp_Amount <= 0) {
        return response()->json(['message' => 'Số tiền hoàn không hợp lệ'], 400);
    }

    // QUAN TRỌNG: Lấy ngày giao dịch gốc từ DB, nếu không có dùng created_at
    $vnp_TransactionDate = $order->payment_date 
        ? $order->payment_date->format('YmdHis') 
        : $order->created_at->format('YmdHis');

    $vnp_CreateDate = date('YmdHis');
    $vnp_CreateBy = $retailer->full_name ?? 'Retailer';
    $vnp_IpAddr = $request->ip() ?? '127.0.0.1';
    $vnp_OrderInfo = "Refund_Order_" . $order->order_id;

    // Hash data theo đúng thứ tự VNPAY spec
    $hashData = implode("|", [
        $vnp_RequestId,
        "2.1.0",
        "refund",
        $vnp_TmnCode,
        "02",
        $vnp_TxnRef,
        $vnp_Amount,
        $vnp_TransactionNo,
        $vnp_TransactionDate,
        $vnp_CreateBy,
        $vnp_CreateDate,
        $vnp_IpAddr,
        $vnp_OrderInfo
    ]);

    $vnp_SecureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

    Log::info('VNPAY Refund Request:', [
        'order_id' => $orderId,
        'vnp_TxnRef' => $vnp_TxnRef,
        'vnp_TransactionNo' => $vnp_TransactionNo,
        'vnp_Amount' => $vnp_Amount,
        'vnp_TransactionDate' => $vnp_TransactionDate,
        'hashData' => $hashData,
    ]);

    $refundData = [
        "vnp_RequestId" => $vnp_RequestId,
        "vnp_Version" => "2.1.0",
        "vnp_Command" => "refund",
        "vnp_TmnCode" => $vnp_TmnCode,
        "vnp_TransactionType" => "02",
        "vnp_TxnRef" => $vnp_TxnRef,
        "vnp_Amount" => $vnp_Amount,
        "vnp_TransactionNo" => $vnp_TransactionNo,
        "vnp_TransactionDate" => $vnp_TransactionDate,
        "vnp_CreateBy" => $vnp_CreateBy,
        "vnp_CreateDate" => $vnp_CreateDate,
        "vnp_IpAddr" => $vnp_IpAddr,
        "vnp_OrderInfo" => $vnp_OrderInfo,
        "vnp_SecureHash" => $vnp_SecureHash
    ];

    try {
        // VNPAY API requires proper headers
        $response = Http::withoutVerifying()
            ->withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ])
            ->timeout(30)
            ->post($vnp_apiUrl, $refundData);
        
        $result = $response->json();
        
        Log::info('VNPAY Refund Response:', [
            'order_id' => $orderId,
            'response_code' => $result['vnp_ResponseCode'] ?? null,
            'response_msg' => $result['vnp_Message'] ?? null,
            'response' => $result
        ]);

        // ResponseCode '00' = success
        if (isset($result['vnp_ResponseCode']) && $result['vnp_ResponseCode'] == '00') {
            $order->status = 'cancelled';
            $order->payment_status = 'refunded';
            $order->refund_amount = $order->total_amount;
            $order->refund_date = now();
            $order->save();

            return response()->json(['message' => 'Đơn hàng đã hủy và hoàn tiền VNPAY thành công! Tiền sẽ về tài khoản trong 3-5 ngày.']);
        } 
        // ResponseCode '99' = system error, có thể retry
        elseif (isset($result['vnp_ResponseCode']) && $result['vnp_ResponseCode'] == '99') {
            Log::warning('VNPAY System Error 99 - possible sandbox issue, cancelling order anyway', [
                'order_id' => $orderId,
                'vnp_TxnRef' => $vnp_TxnRef
            ]);
            
            // Hủy đơn vẫn thành công, hoàn tiền sẽ xử lý backend
            $order->status = 'cancelled';
            $order->payment_status = 'refunded'; // Đánh dấu là đã refund (hoặc sắp refund)
            $order->refund_amount = $order->total_amount;
            $order->refund_date = now();
            $order->payment_note = 'VNPAY Error 99 - Refund processing by VNPAY backend';
            $order->save();
            
            return response()->json([
                'message' => 'Đơn hàng đã hủy. Hệ thống hoàn tiền đang xử lý. Tiền sẽ về trong 3-5 ngày hoặc vui lòng liên hệ support.'
            ], 200);
        }
        else {
            $responseCode = $result['vnp_ResponseCode'] ?? 'unknown';
            $responseMsg = $result['vnp_Message'] ?? $result['message'] ?? 'Hoàn tiền VNPAY thất bại';
            
            Log::error('VNPAY Refund Failed:', [
                'order_id' => $orderId,
                'response_code' => $responseCode,
                'response_msg' => $responseMsg
            ]);
            
            return response()->json([
                'message' => 'Hủy đơn thành công nhưng hoàn tiền VNPAY thất bại: ' . $responseMsg . ' (Mã: ' . $responseCode . ')'
            ], 400);
        }
    } catch (\Exception $e) {
        Log::error('VNPAY Refund Exception:', [
            'order_id' => $orderId,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'message' => 'Lỗi hệ thống khi hoàn tiền: ' . $e->getMessage()
        ], 500);
    }
}
}