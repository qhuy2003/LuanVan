<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // 🟢 Lấy danh sách sản phẩm
    public function index()
    {
        return response()->json(Product::all());
    }

    // 🔵 Lấy chi tiết sản phẩm
    public function show($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }
        return response()->json($product);
    }

    // ➕ Thêm sản phẩm
public function store(Request $request)
{

    $request->validate([
        'product_name' => 'required|string|max:255',
        'description' => 'required|string',
        'price' => 'required|numeric',
        'stock' => 'required|integer',
        'category_id' => 'required|exists:categories,category_id'
    ]);

    $userId = auth()->id(); // ← BÂY GIỜ LÀ GUARD 'api' → CÓ GIÁ TRỊ!

    $product = Product::create([
        'product_name' => $request->product_name,
        'description' => $request->description,
        'price' => $request->price,
        'stock' => $request->stock,
        'category_id' => $request->category_id,
        'brand_id' => $userId,
    ]);

    return response()->json($product, 201);
}


    // 📝 Cập nhật sản phẩm
    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }

        $product->update($request->all());
        return response()->json(['message' => 'Cập nhật thành công', 'product' => $product]);
    }

    // 🗑️ Xóa sản phẩm
    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }

        $product->delete();
        return response()->json(['message' => 'Xóa sản phẩm thành công']);
    }

    // 🛍️ Lấy danh sách sản phẩm cho retailer (chỉ sản phẩm hoạt động)
    public function retailerProducts()
    {
        $products = Product::where('is_active', true)->get();
        return response()->json($products);
    }
}
