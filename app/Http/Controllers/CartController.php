<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
public function index()
{
    $user = Auth::user();
    
    if (!$user) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    $retailer = $user->retailer;
    
    if (!$retailer) {
        return response()->json(['message' => 'User is not a retailer'], 403);
    }

     $cart = Cart::with([
        'items.product' => function ($query) {
            $query->select('product_id', 'brand_id', 'product_name', 'price', 'is_active', 'image', 'weight_kg', 'volume_m3', 'shipping_type_id', 'suggested_vehicle')
                  ->with(['brand' => function ($q) {
                      $q->select('brand_id', 'brand_name', 'address'); 
                  }]);
        },
        'items.product.shippingType'
    ])
    ->where('retailer_id', $retailer->retailer_id)
    ->first();

    if (!$cart) {
        $cart = Cart::create(['retailer_id' => $retailer->retailer_id]);
    }

    $items = $cart->items->map(function ($item) {
                $brand = $item->product->brand ?? null;

           Log::info('Cart item brand data:', [
            'product_id' => $item->product_id,
            'brand' => $brand,
            'has_brand' => !is_null($brand),
            'brand_name' => $brand ? $brand->brand_name : null,
            'brand_address' => $brand ? $brand->address : null,
        ]);
        
        // Lấy suggested_vehicle từ Product hoặc ShippingType
        $suggestedVehicle = $item->product->suggested_vehicle ?? $item->product->shippingType?->suggested_vehicle ?? 'xe_may';
        
        return [
            'cart_item_id' => $item->cart_item_id,
            'product_id' => $item->product_id,
            'quantity' => $item->quantity,
            'product_name' => $item->product->product_name ?? 'N/A',
            'price' => $item->product->price ?? 0,
            'image_url'    => $item->product->image ? asset('storage/' .$item->product->image) : null, 
            'weight_kg' => $item->product->weight_kg ?? 0,
            'volume_m3' => $item->product->volume_m3 ?? 0,
            'shipping_type_id' => $item->product->shipping_type_id ?? 1,
            'shipping_type' => $item->product->shippingType ?? null,
            'suggested_vehicle' => $suggestedVehicle,
            'brand_id'         => $item->product->brand?->brand_id,
            'brand_name'       => $item->product->brand?->brand_name ?? 'Không có nhãn hàng',
            'brand_address'    => $item->product->brand?->address ?? 'Chưa có địa chỉ kho', 
            'is_active' => $item->product->is_active ?? true,
        ];
    });

    return response()->json([
        'items' => $items,
        'total_quantity' => $cart->items->sum('quantity')
    ]);
}

        public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,product_id',
            'quantity'   => 'integer|min:1'
        ]);

        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $retailer = $user->retailer;
        
        if (!$retailer) {
            return response()->json(['message' => 'User is not a retailer'], 403);
        }

        $cart = Cart::firstOrCreate(['retailer_id' => $retailer->retailer_id]);

        $productId = $request->product_id;
        $addQty = $request->quantity ?? 1;

        // Kiểm tra item đã tồn tại chưa
        $item = CartItem::where('cart_id', $cart->cart_id)
                        ->where('product_id', $productId)
                        ->first();

        if ($item) {
            // Đã có → cộng dồn
            $item->quantity += $addQty;
            $item->save();
        } else {
            // Chưa có → tạo mới với quantity chính xác
            $item = CartItem::create([
                'cart_id'    => $cart->cart_id,
                'product_id' => $productId,
                'quantity'   => $addQty
            ]);
        }

        return response()->json([
            'message' => 'Đã thêm vào giỏ hàng',
            'item'    => $item->load('product')
        ]);
    }

    public function update(Request $request, $productId)
    {
        $request->validate(['quantity' => 'required|integer|min:1']);

        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $retailer = $user->retailer;
        
        if (!$retailer) {
            return response()->json(['message' => 'User is not a retailer'], 403);
        }

        $cart = Cart::where('retailer_id', $retailer->retailer_id)->firstOrFail();

        $item = CartItem::where('cart_id', $cart->cart_id)
                        ->where('product_id', $productId)
                        ->firstOrFail();

        $item->quantity = $request->quantity;
        $item->save();

        return response()->json(['message' => 'Cập nhật số lượng thành công']);
    }

    public function remove($productId)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $retailer = $user->retailer;
        
        if (!$retailer) {
            return response()->json(['message' => 'User is not a retailer'], 403);
        }

        $cart = Cart::where('retailer_id', $retailer->retailer_id)->firstOrFail();

        CartItem::where('cart_id', $cart->cart_id)
                ->where('product_id', $productId)
                ->delete();

        return response()->json(['message' => 'Đã xóa khỏi giỏ hàng']);
    }

    public function clear()
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $retailer = $user->retailer;
        
        if (!$retailer) {
            return response()->json(['message' => 'User is not a retailer'], 403);
        }

        $cart = Cart::where('retailer_id', $retailer->retailer_id)->firstOrFail();
        CartItem::where('cart_id', $cart->cart_id)->delete();

        return response()->json(['message' => 'Đã làm trống giỏ hàng']);
    }
}