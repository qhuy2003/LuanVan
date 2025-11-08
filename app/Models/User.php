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
}
