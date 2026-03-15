<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromotionTarget extends Model
{
    protected $table = 'promotion_targets';
    public $timestamps = false;
    protected $fillable = ['promotion_id', 'product_id', 'category_id'];

    public function promotion()
    {
        return $this->belongsTo(Promotion::class, 'promotion_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function category()
    {
        return $this->belongsTo(Categories::class, 'category_id');
    }
}