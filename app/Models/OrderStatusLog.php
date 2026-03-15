<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OrderStatusLog extends Model
{
    use HasFactory;

    protected $table = 'order_status_logs';

    protected $primaryKey = 'log_id';

    public $timestamps = false; // Chỉ có created_at, không có updated_at

    protected $fillable = [
        'order_id',
        'status',
        'note',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Quan hệ ngược: một log thuộc về một đơn hàng
     */
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}