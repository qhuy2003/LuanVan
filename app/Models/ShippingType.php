<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingType extends Model
{
    protected $table = 'shipping_types';

protected $fillable = [
        'name',
        'base_fee',
        'fee_per_km',
        'fee_per_kg',
        'fee_per_m3',
        'urgent_fee',
        'cod_fee',
        'remote_fee',
        'suggested_vehicle'
    ];
    protected $visible = [
        'shipping_type_id',
        'name',
        'base_fee',
        'fee_per_km',
        'fee_per_kg',
        'fee_per_m3',
        'urgent_fee',
        'cod_fee',
        'remote_fee',
        'suggested_vehicle' // ← THÊM DÒNG NÀY
    ];
}

