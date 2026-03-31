<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use Notifiable;
        protected $table = 'users';
    protected $primaryKey = 'user_id';
     public $timestamps = true ;
    protected $fillable = [
        'name', 'email', 'password', 'role',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    // ⚙️ Hai hàm bắt buộc khi implements JWTSubject
    public function getJWTIdentifier()
    {
        return $this->getKey(); // Trả về khóa chính của user
    }

    public function getJWTCustomClaims()
    {
        return []; // Có thể thêm thông tin phụ vào token (nếu cần)
    }

    // 🔗 Relationships
    public function retailer()
    {
        return $this->hasOne(Retailer::class, 'user_id', 'user_id');
    }

    public function brand()
    {
        return $this->hasOne(Brand::class, 'user_id', 'user_id');
    }

    public function shipper()
    {
        return $this->hasOne(Shipper::class, 'user_id', 'user_id');
    }
}
