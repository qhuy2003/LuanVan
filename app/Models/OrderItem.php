<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $table = 'order_items'; 

    protected $primaryKey = 'order_item_id'; 

    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'unit_price'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2'
    ];

    // Quan hệ: sản phẩm
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    // Quan hệ: đơn hàng
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}