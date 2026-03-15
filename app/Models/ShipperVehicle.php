<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShipperVehicle extends Model
{
    protected $table = 'shipper_vehicles';
    protected $primaryKey = 'id';
    protected $fillable = ['shipper_id', 'vehicle_type', 'license_plate', 'status'];

    public function shipper()
    {
        return $this->belongsTo(Shipper::class, 'shipper_id');
    }
}