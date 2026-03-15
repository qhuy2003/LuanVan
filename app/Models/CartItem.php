<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    protected $primaryKey = 'cart_item_id';
    protected $fillable = ['cart_id', 'product_id', 'quantity'];

    public function cart()
    {
        return $this->belongsTo(Cart::class, 'cart_id');
    }

    public function product()
    {
        return $this->hasOne(Product::class, 'product_id', 'product_id')
                  ->select('product_id', 'product_name', 'price', 'image', 'weight_kg', 'volume_m3', 'shipping_type_id');
    }
}