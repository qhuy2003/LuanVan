<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use App\Models\PromotionTarget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PromotionController extends Controller
{

    /**
     * Apply a voucher (for frontend use)
     */
    public function apply(Request $request)
    {
        $request->validate([
            'code' => 'required|string'
        ]);

        $promotion = Promotion::where('code', $request->code)->first();
        if (!$promotion) {
            return response()->json(['success' => false, 'message' => 'Mã khuyến mãi không tồn tại'], 404);
        }

        if (!$promotion->is_active) {
            return response()->json(['success' => false, 'message' => 'Mã khuyến mãi đã bị tắt'], 400);
        }

        $now = now();
        if ($promotion->start_date && $now->lt(
            \Carbon\Carbon::parse($promotion->start_date))) {
            return response()->json(['success' => false, 'message' => 'Mã khuyến mãi chưa có hiệu lực'], 400);
        }
        if ($promotion->end_date && $now->gt(\Carbon\Carbon::parse($promotion->end_date))) {
            return response()->json(['success' => false, 'message' => 'Mã khuyến mãi đã hết hạn'], 400);
        }
        $orderAmount = $request->order_amount ?? 0; 
        if ($promotion->min_order_amount > 0 && $orderAmount < $promotion->min_order_amount ) {
            return response()->json([
                'message' => "Đơn hàng cần từ " . number_format($promotion->min_order_amount) . "đ để dùng mã này"
            ], 400);
        }
        // Optional: check usage limit if fields exist
        if (!is_null($promotion->usage_limit) && isset($promotion->used_count) && $promotion->used_count >= $promotion->usage_limit) {
            return response()->json(['success' => false, 'message' => 'Mã khuyến mãi đã đạt giới hạn sử dụng'], 400);
        }

        return response()->json(['success' => true, 'data' => $promotion]);
    }

    public function index()
{
    $user = auth('api')->user(); 

    $query = Promotion::with([
        'targets.product',
        'targets.category',
        'brand',
        'creator' => fn($q) => $q->select('user_id', 'full_name', 'role')
    ]);

    // CHỈ LỌC KHI LÀ BRAND VÀ CÓ brand_id
    if ($user && $user->role === 'brand') {
        // DÙNG optional() ĐỂ TRÁNH LỖI NULL
        $brandId = optional($user->brand)->brand_id;

        if ($brandId) {
            $query->where('brand_id', $brandId);
        } else {
            // Nếu user là brand nhưng không có brand → không cho xem gì cả
            return response()->json(['data' => []]);
        }
    }

    $promotions = $query->orderByDesc('created_at')->get();

    return response()->json([
        'success' => true,
        'data' => $promotions
    ]);
}
    public function store(Request $request)
{
    $request->validate([
        'code'              => 'required|string|max:30|unique:promotions,code',
        'name'              => 'required|string|max:150',
        'description'       => 'nullable|string',
        'type'              => 'required|in:percentage,fixed_amount,free_shipping',
        'value'             => 'required|numeric|min:0',
        'max_discount'      => 'nullable|numeric|min:0',
        'min_order_amount'  => 'required|numeric|min:0',
        'start_date'        => 'required|date',
        'end_date'          => 'required|date|after_or_equal:start_date',
        'usage_limit'       => 'nullable|integer|min:1',
        'scope'             => 'required|in:all,products,categories',
        'product_ids'       => 'array|required_if:scope,products',
        'product_ids.*'     => 'exists:products,product_id',
        'category_ids'      => 'array|required_if:scope,categories',
        'category_ids.*'    => 'exists:categories,category_id',
    ]);

    $user = auth('api')->user();
    
    DB::beginTransaction();
    try {
        // Prepare data
        $data = $request->only([
            'code', 'name', 'description', 'type', 'value', 'max_discount',
            'min_order_amount', 'start_date', 'end_date', 'usage_limit', 'scope'
        ]);

        // Add creator and brand info
        $data['created_by'] = $user->user_id;
        $data['brand_id'] = $user->role === 'brand' 
            ? optional($user->brand)->brand_id : null;
        $data['is_active'] = true;

   
        // Create promotion
        $promotion = Promotion::create($data);

        // Handle targets
        if ($request->scope === 'products' && $request->filled('product_ids')) {
            foreach ($request->product_ids as $pid) {
                PromotionTarget::create([
                    'promotion_id' => $promotion->promotion_id, 
                    'product_id'   => $pid
                ]);
            }
        }

        if ($request->scope === 'categories' && $request->filled('category_ids')) {
            foreach ($request->category_ids as $cid) {
                PromotionTarget::create([
                    'promotion_id' => $promotion->promotion_id,
                    'category_id'  => $cid
                ]);
            }
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Tạo khuyến mãi thành công!',
            'data'    => $promotion->fresh()->load('targets')
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Tạo thất bại!',
            'error'   => $e->getMessage()
        ], 500);
    }
}

    public function update(Request $request, $id)
    {
        $promotion = Promotion::findOrFail($id);

        $request->validate([
            'code'            => 'required|string|max:30|unique:promotions,code,' . $id . ',promotion_id',
            'name'            => 'required|string|max:150',
            'description'     => 'nullable|string',
            'type'            => 'required|in:percentage,fixed_amount,free_shipping',
            'value'           => 'required|numeric|min:0',
            'max_discount'    => 'nullable|numeric|min:0',
            'min_order_amount'=> 'required|numeric|min:0',
            'start_date'      => 'required|date',
            'end_date'        => 'required|date|after_or_equal:start_date',
            'usage_limit'     => 'nullable|integer|min:1',
            'scope'           => 'required|in:all,products,categories',
            'product_ids'     => 'array|required_if:scope,products',
            'product_ids.*'   => 'exists:products,product_id',
            'category_ids'    => 'array|required_if:scope,categories',
            'category_ids.*'  => 'exists:categories,category_id',
        ]);

        DB::beginTransaction();
        try {
            $promotion->update($request->only([
                'code', 'name', 'description', 'type', 'value', 'max_discount',
                'min_order_amount', 'start_date', 'end_date', 'usage_limit', 'scope'
            ]));

            // Xóa target cũ, thêm mới
            $promotion->targets()->delete();

            if ($request->scope === 'products' && $request->filled('product_ids')) {
                foreach ($request->product_ids as $productId) {
                    PromotionTarget::create([
                        'promotion_id' => $promotion->id,
                        'product_id'   => $productId
                    ]);
                }
            }

            if ($request->scope === 'categories' && $request->filled('category_ids')) {
                foreach ($request->category_ids as $categoryId) {
                    PromotionTarget::create([
                        'promotion_id' => $promotion->id,
                        'category_id'  => $categoryId
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật khuyến mãi thành công!',
                'data'    => $promotion->fresh()->load('targets.product', 'targets.category')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật thất bại!',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $promotion = Promotion::findOrFail($id);
        
        DB::transaction(function () use ($promotion) {
            $promotion->targets()->delete();
            $promotion->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Xóa khuyến mãi thành công!'
        ]);
    }

    public function toggleActive($id)
    {
        $promotion = Promotion::findOrFail($id);
        $promotion->is_active = !$promotion->is_active;
        $promotion->save();

        return response()->json([
            'success' => true,
            'is_active' => $promotion->is_active
        ]);
    }

    public function publicIndex()
{
    $promotions = Promotion::with(['targets.product', 'targets.category'])
        ->whereNull('brand_id')           // CHỈ LẤY VOUCHER TOÀN SÀN (admin tạo)
        ->where('is_active', true)
        ->where('start_date', '<=', now())
        ->where('end_date', '>=', now())
        ->orderByDesc('created_at')
        ->get();

    return response()->json([
        'success' => true,
        'data' => $promotions
    ]);
}
public function publicIndexBrand($id)
{
    $promotions = Promotion::with(['targets.product', 'targets.category'])
        ->where('brand_id', $id)           
        ->where('is_active', true)
        ->where('start_date', '<=', now())
        ->where('end_date', '>=', now())
        ->orderByDesc('created_at')
        ->get();

    return response()->json([
        'success' => true,
        'data' => $promotions
    ]);
}
}