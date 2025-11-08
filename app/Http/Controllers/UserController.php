<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function countUsers()
    {
        try {
            $count = User::count();
            return response()->json(['count' => $count]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Lỗi khi đếm user: ' . $e->getMessage()
            ], 500);
        }
    }
}
