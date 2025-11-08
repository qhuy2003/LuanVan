<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id('product_id'); // nếu trong model bạn dùng khóa chính là 'product_id'
            $table->unsignedBigInteger('brand_id')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('product_name', 255);
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('stock')->default(0);
            $table->timestamp('created_at')->useCurrent();
            // Nếu bạn không dùng updated_at thì không cần timestamps()
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
