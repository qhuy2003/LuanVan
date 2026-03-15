<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipper extends Model
{
    protected $primaryKey = 'shipper_id';
    protected $fillable = ['user_id', 'id_card', 'status', 'rating', 'current_lat', 'current_lon','phone'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id','user_id');
    }

    public function vehicles()
    {
        return $this->hasMany(ShipperVehicle::class, 'shipper_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'shipper_id');
    }
}