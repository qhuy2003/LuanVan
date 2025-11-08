<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    // Khóa chính trong bảng
    protected $primaryKey = 'product_id';

    // Tên bảng (nếu Laravel không tự nhận đúng)
    protected $table = 'products';

    // Các cột cho phép ghi
    protected $fillable = [
        'brand_id',
        'category_id',
        'product_name',
        'description',
        'price',
        'stock',
        
    ];

    // Nếu bảng có cột created_at nhưng không có updated_at
    public $timestamps = false;

    // Nếu bạn vẫn muốn Laravel quản lý created_at
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;
}
