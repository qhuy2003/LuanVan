<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    // 🟢 Đăng ký
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:brand,retailer,shipper',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role
        ]);

        return response()->json([
            'message' => 'Đăng ký thành công!',
            'user' => $user
        ], 201);
    }

    // 🟡 Đăng nhập
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json(['error' => 'Email hoặc mật khẩu sai!'], 401);
        }

        return response()->json([
            'message' => 'Đăng nhập thành công!',
            'token' => $token,
            'user' => auth()->user()
        ]);
    }

    // 🔵 Lấy thông tin user hiện tại
    public function me()
    {
        return response()->json(auth()->user());
    }

    // 🟢 Alias for me() - get profile
    public function profile()
    {
        return response()->json(auth()->user());
    }

    // 🟢 Update profile
    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        
        $request->validate([
            'full_name' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|unique:users,email,' . $user->user_id . ',user_id',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $user->update($request->only(['full_name', 'email', 'phone', 'address']));

        return response()->json([
            'message' => 'Cập nhật hồ sơ thành công!',
            'user' => $user
        ]);
    }

    // 🟢 Change password
    public function changePassword(Request $request)
    {
        $request->validate([
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = auth()->user();

        if (!Hash::check($request->old_password, $user->password)) {
            return response()->json(['message' => 'Mật khẩu cũ không chính xác'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Đổi mật khẩu thành công!'
        ]);
    }

    // 🟢 Logout
    public function logout()
    {
        auth()->logout();
        return response()->json(['message' => 'Đăng xuất thành công!']);
    }
}
