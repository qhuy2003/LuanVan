<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Retailer;
use App\Models\Brand;
use App\Models\User;
class Order extends Model
{

    protected $table = 'orders'; 

    protected $primaryKey = 'order_id'; 

    protected $fillable = [
        'retailer_id',
        'brand_id',
        'shipper_id',
        'promotion_id',       
        'discount_amount',      
        'order_date',
        'status',
        'total_amount',
        'shipping_fee',         
        'distance_km',        
        'shipping_address',     
        'estimated_delivery',   
        'note',          
        'payment_method',   
        'payment_status',
        'payment_note',
        'vnp_txn_ref',
        'vnp_transaction_no',
        'refund_amount',
        'refund_date',
    ];


    // Nếu muốn cast kiểu dữ liệu
    protected $casts = [
        'order_date'         => 'datetime',
        'estimated_delivery' => 'datetime',
        'total_amount'       => 'decimal:2',
        'shipping_fee'       => 'decimal:2',
        'discount_amount'    => 'decimal:2',
        'distance_km'        => 'decimal:2',
    ];

    // Quan hệ: 1 đơn có nhiều sản phẩm
    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    // Quan hệ: retailer
    public function retailer()
    {
        return $this->belongsTo(Retailer::class, 'retailer_id', 'retailer_id');
    }

    // Quan hệ: brand
    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id', 'brand_id');
    }

    // Quan hệ: shipper
    public function shipper()
    {
        return $this->belongsTo(User::class, 'shipper_id');
    }
}
