<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promotion extends Model
{
    protected $table = 'promotions';
    protected $primaryKey = 'promotion_id'; 
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'code',
        'name',
        'description',
        'type',                    // percentage | fixed_amount | free_shipping
        'value',
        'max_discount',
        'scope',                   // all | products | categories
        'min_order_amount',
        'usage_limit',
        'used_count',
        'start_date',
        'end_date',
        'created_by',
        'brand_id',
        'is_active',
    ];

    protected $casts = [
        'value'            => 'decimal:2',
        'max_discount'     => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'usage_limit'      => 'integer',
        'used_count'       => 'integer',
        'is_active'        => 'boolean',
        'start_date'       => 'datetime',
        'end_date'         => 'datetime',
        'created_at'       => 'datetime',
        'updated_at'       => 'datetime',
    ];

    // Quan hệ với bảng promotion_targets
    public function targets(): HasMany
    {
        return $this->hasMany(PromotionTarget::class, 'promotion_id', 'promotion_id');
    }


    // Scope để lấy khuyến mãi đang hoạt động
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                     ->where('start_date', '<=', now())
                     ->where('end_date', '>=', now());
    }

    // Kiểm tra còn lượt dùng không
    public function hasUsageLeft(): bool
    {
        return is_null($this->usage_limit) || $this->used_count < $this->usage_limit;
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function index()
{
    $user = auth('api')->user(); // hoặc $request->user()

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
}