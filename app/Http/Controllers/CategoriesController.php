<?php

namespace App\Http\Controllers;

use App\Models\Categories;
use Illuminate\Http\Request;

class CategoriesController extends Controller
{
    // Lấy danh sách categories
    public function index()
    {
        $categories = Categories::with('brand')->get(); 
        return response()->json($categories);   
    }

    public function store(Request $request)
{
    $request->validate([
        'category_name' => 'required|string|unique:categories,category_name', 
        'description'   => 'required|string',
        'brand_id'      => 'nullable|integer|exists:brands,brand_id'
    ]);

    $category = Categories::create([
        'category_name' => $request->category_name,
        'description'   => $request->description,
        'brand_id'      => $request->brand_id
    ]);

    return response()->json([
        'message'  => 'Thêm danh mục thành công',
        'category' => $category
    ], 201);
}

    // Lấy chi tiết một category
    public function show($id)
    {
        $category = Categories::find($id);
        
        if (!$category) {
            return response()->json([
                'message' => 'Không tìm thấy danh mục'
            ], 404);
        }

        return response()->json($category);
    }

    // Cập nhật category
    public function update(Request $request, $id)
    {
        $category = Categories::find($id);

        if (!$category) {
            return response()->json([
                'message' => 'Không tìm thấy danh mục'
            ], 404);
        }

        $request->validate([
            'category_name' => 'required|string',
            'description' => 'required|string',
            'brand_id' => 'nullable|integer'
        ]);

        $category->update([
            'category_name' => $request->category_name,
            'description' => $request->description,
            'brand_id' => $request->brand_id
        ]);

        return response()->json([
            'message' => 'Cập nhật danh mục thành công',
            'category' => $category
        ]);
    }

    // Xóa category
    public function destroy($id)
    {
        $category = Categories::find($id);
        
        if (!$category) {
            return response()->json([
                'message' => 'Không tìm thấy danh mục'
            ], 404);
        }

        $category->delete();

        return response()->json([
            'message' => 'Xóa danh mục thành công'
        ]);
    }
}