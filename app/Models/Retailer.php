<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Retailer extends Model
{
    protected $primaryKey = 'retailer_id';
    protected $fillable = ['user_id', 'store_name', 'address', 'phone'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'retailer_id');
    }

    public function cart()
    {
        return $this->hasOne(Cart::class, 'retailer_id');
    }
}