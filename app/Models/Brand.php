<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Retailer;
use App\Models\Shipper;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Categories;
use App\Models\Product;
use App\Models\Promotion;
class Brand extends Model
{
    protected $table = 'brands'; 
    protected $primaryKey = 'brand_id'; 
    protected $fillable = ['user_id', 'brand_name', 'address', 'phone', 'logo', 'warehouse_lat', 'warehouse_lng', 'warehouse_address'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id','user_id');

    }

    public function categories()
    {
        return $this->hasMany(Categories::class, 'brand_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'brand_id');
    }
    public function promotions()
    {
        return $this->hasMany(Promotion::class, 'brand_id');
    }
    public function orders()
    {
        return $this->hasMany(Order::class, 'brand_id');
    }
}