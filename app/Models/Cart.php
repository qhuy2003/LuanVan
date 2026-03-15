<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $primaryKey = 'cart_id';
    protected $fillable = ['retailer_id'];

    public function items()
    {
        return $this->hasMany(CartItem::class, 'cart_id');
    }

    public function retailer()
    {
        return $this->belongsTo(Retailer::class, 'retailer_id');
    }
}