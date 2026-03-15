<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Categories extends Model
{
    protected $table = 'categories';
    protected $primaryKey = 'category_id';
    
    protected $fillable = [
        'category_name',
        'description',
        'brand_id',
        'category_id'
    ];

    // Relationship với products
    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }

     public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class, 'brand_id', 'brand_id');
    }

}