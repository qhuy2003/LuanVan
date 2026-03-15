<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Thêm các field VNPAY nếu chưa có
            if (!Schema::hasColumn('orders', 'vnp_txn_ref')) {
                $table->string('vnp_txn_ref')->nullable()->comment('VNPAY Transaction Reference from frontend');
            }
            if (!Schema::hasColumn('orders', 'vnp_transaction_no')) {
                $table->string('vnp_transaction_no')->nullable()->comment('VNPAY Transaction Number');
            }
            if (!Schema::hasColumn('orders', 'refund_amount')) {
                $table->decimal('refund_amount', 12, 2)->nullable()->comment('Refunded amount');
            }
            if (!Schema::hasColumn('orders', 'refund_date')) {
                $table->timestamp('refund_date')->nullable()->comment('Date when refund was processed');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['vnp_txn_ref', 'vnp_transaction_no', 'refund_amount', 'refund_date']);
        });
    }
};
