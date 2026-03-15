<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
class PaymentController extends Controller
{
    public function createVnpayPayment(Request $request)
    {
        $vnp_TmnCode = config('vnpay.vnp_TmnCode');
        $vnp_HashSecret = config('vnpay.vnp_HashSecret');
        $vnp_Url = config('vnpay.vnp_Url');
        $vnp_Returnurl = config('vnpay.vnp_ReturnUrl');

        $request->validate([
            'order_id' => 'required|string',
            'amount' => 'required|numeric|min:1000',
            'order_info' => 'required|string'
        ]);

        $vnp_TxnRef = $request->order_id . '_' . time();
        $vnp_OrderInfo = $request->order_info;
        $vnp_OrderType = 'billpayment';
        $vnp_Amount = $request->amount * 100; // VNPAY x100
        $vnp_Locale = 'vn';
        $vnp_IpAddr = $request->ip();

        $inputData = [
            "vnp_Version" => "2.1.0",
            "vnp_TmnCode" => $vnp_TmnCode,
            "vnp_Amount" => $vnp_Amount,
            "vnp_Command" => "pay",
            "vnp_CreateDate" => date('YmdHis'),
            "vnp_CurrCode" => "VND",
            "vnp_IpAddr" => $vnp_IpAddr,
            "vnp_Locale" => $vnp_Locale,
            "vnp_OrderInfo" => $vnp_OrderInfo,
            "vnp_OrderType" => $vnp_OrderType,
            "vnp_ReturnUrl" => $vnp_Returnurl,
            "vnp_TxnRef" => $vnp_TxnRef,
        ];

        ksort($inputData);
        $query = "";
        $i = 0;
        $hashdata = "";
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashdata .= urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
            $query .= urlencode($key) . "=" . urlencode($value) . '&';
        }

        $vnp_Url = $vnp_Url . "?" . $query;
        $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
        $vnp_Url .= 'vnp_SecureHash=' . $vnpSecureHash;

        return response()->json(['payment_url' => $vnp_Url]);
    }

public function vnpayReturn(Request $request)
{
    $vnp_HashSecret = config('vnpay.vnp_HashSecret');
    $inputData = $request->all();
    $vnp_SecureHash = $inputData['vnp_SecureHash'] ?? '';
    unset($inputData['vnp_SecureHash']);
    ksort($inputData);
    $hashData = http_build_query($inputData, 0, '&');
    $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

    if ($secureHash === $vnp_SecureHash && $inputData['vnp_ResponseCode'] == '00') {
        $orderId = explode('_', $inputData['vnp_TxnRef'])[0]; // Lấy order_id từ TxnRef (42_...)
        $order = Order::where('order_id', $orderId)->first();

        if ($order) {
            $order->update([
                'payment_status' => 'paid',
                'vnp_txn_ref' => $inputData['vnp_TxnRef'],             
                'vnp_transaction_no' => $inputData['vnp_TransactionNo'],
                'vnp_response_code' => $inputData['vnp_ResponseCode'],
                'payment_date' => now(),  // Cập nhật payment_date
            ]);
        }

        return redirect('/checkout/success?order_id=' . $orderId);
    } else {
        return redirect('/checkout/fail?code=' . $inputData['vnp_ResponseCode']);
    }
}

    public function vnpayIpn(Request $request)
    {
        $vnp_HashSecret = config('vnpay.vnp_HashSecret');
        $inputData = $request->all();
        $vnp_SecureHash = $inputData['vnp_SecureHash'] ?? '';
        unset($inputData['vnp_SecureHash']);
        ksort($inputData);
        $hashData = http_build_query($inputData, 0, '&');
        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        if ($secureHash === $vnp_SecureHash && $inputData['vnp_ResponseCode'] == '00') {
            $orderId = $inputData['vnp_TxnRef'];
            $order = Order::where('order_id', $orderId)->first();
            if ($order) {
                $order->payment_status = 'paid';
                $order->save();
            }

            return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
        } else {
            return response()->json(['RspCode' => '97', 'Message' => 'Invalid signature']);
        }
    }
    // PaymentController.php
public function refundVnpay(Request $request, $orderId)
{
    $request->validate([
        'amount' => 'required|numeric|min:1000', // số tiền hoàn (có thể hoàn một phần)
        'transaction_no' => 'required|string', // vnp_TransactionNo từ VNPAY return
        'reason' => 'required|string'
    ]);

    $order = Order::findOrFail($orderId);

    if ($order->payment_method !== 'vnpay' || $order->payment_status !== 'paid') {
        return response()->json(['message' => 'Đơn không hợp lệ để hoàn tiền'], 400);
    }

    $vnp_TmnCode = config('vnpay.vnp_TmnCode');
    $vnp_HashSecret = config('vnpay.vnp_HashSecret');
    $vnp_apiUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"; // sandbox

    $data = [
        "vnp_Version" => "2.1.0",
        "vnp_Command" => "refund",
        "vnp_TmnCode" => $vnp_TmnCode,
        "vnp_TransactionType" => "02", // 02 = hoàn toàn phần
        "vnp_TxnRef" => $order->order_id,
        "vnp_Amount" => $request->amount * 100,
        "vnp_TransactionNo" => $request->transaction_no,
        "vnp_TransactionDate" => $order->payment_date->format('YmdHis'), // ngày thanh toán gốc
        "vnp_CreateBy" => auth()->user()->full_name,
        "vnp_CreateDate" => date('YmdHis'),
        "vnp_IpAddr" => $request->ip(),
        "vnp_OrderInfo" => "Hoan tien don hang {$order->order_id}: {$request->reason}"
    ];

    ksort($data);
    $hashdata = http_build_query($data);
    $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
    $data['vnp_SecureHash'] = $vnpSecureHash;

    $response = Http::post($vnp_apiUrl, $data);
    $result = $response->json();

    if ($result['vnp_ResponseCode'] == '00') {
        $order->status = 'refunded';
        $order->refund_amount = $request->amount;
        $order->refund_date = now();
        $order->refund_reason = $request->reason;
        $order->refund_transaction_id = $result['vnp_TransactionNo'] ?? null;
        $order->save();

        // Hoàn stock
        foreach ($order->items as $item) {
            $product = $item->product;
            $product->increment('stock', $item->quantity);
        }

        return response()->json(['message' => 'Hoàn tiền thành công! Tiền sẽ về tài khoản trong 3-5 ngày.']);
    }

    return response()->json(['message' => 'Hoàn tiền thất bại: ' . $result['vnp_ResponseMessage']], 400);
}







public function createZaloPayPayment(Request $request)
{
    $config = config('zalopay');

    $request->validate([
        'order_id' => 'required|string',
        'amount' => 'required|numeric|min:1000',
        'order_info' => 'required|string'
    ]);

    $transID = rand(0, 1000000);
    $app_trans_id = date('ymd') . '_' . $transID;

    $order = [
        'app_id' => $config['app_id'],
        'app_time' => round(microtime(true) * 1000),
        'app_trans_id' => $app_trans_id,
        'app_user' => 'QHLogistics',
        'item' => '[]',
        'embed_data' => json_encode([
            'redirecturl' => $config['return_url'] . '?order_id=' . $request->order_id
        ]),
        'amount' => $request->amount,
        'description' => $request->order_info,
        'bank_code' => ''
    ];

    $data = $order['app_id'] . '|' . $order['app_trans_id'] . '|' . $order['app_user'] . '|' . $order['amount']
        . '|' . $order['app_time'] . '|' . $order['embed_data'] . '|' . $order['item'];

    $order['mac'] = hash_hmac('sha256', $data, $config['key1']);

    try {
        $response = Http::asForm()
            ->withOptions(['verify' => false])
            ->post($config['endpoint'], $order);

        $result = $response->json();

        Log::info('ZaloPay Response', ['data' => $result]);

        if (isset($result['return_code']) && $result['return_code'] == 1) {
            return response()->json([
                'payment_url' => $result['order_url'],
                'zp_trans_token' => $result['zp_trans_token'] ?? null
            ]);
        }

        return response()->json([
            'message' => 'Lỗi từ ZaloPay: ' . ($result['return_message'] ?? 'Không rõ')
        ], 400);

    } catch (\Exception $e) {
        Log::error('ZaloPay Exception', ['message' => $e->getMessage()]);
        return response()->json([
            'message' => 'Lỗi kết nối ZaloPay: ' . $e->getMessage()
        ], 500);
    }
}

public function zaloPayReturn(Request $request)
{
    // ZaloPay redirect bắt nguồn từ embed_data redirect_url
    // Dữ liệu thực tế về thanh toán sẽ được xử lý bởi client-side React component
    // Return các query parameters để React component xử lý
    $orderId = $request->query('order_id');
    $status = $request->query('status');
    $redirectUrl = 'http://localhost:5173/checkout/zalopay-return';
    
    // Append parameters nếu có
    if ($orderId) {
        $redirectUrl .= '?order_id=' . urlencode($orderId);
    }
    if ($status) {
        $redirectUrl .= ($orderId ? '&' : '?') . 'status=' . urlencode($status);
    }
    
    return redirect($redirectUrl);
}
}