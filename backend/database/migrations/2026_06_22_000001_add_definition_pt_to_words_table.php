<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('words', function (Blueprint $table): void {
            $table->text('definition_pt')->nullable()->after('definition');
        });
    }

    public function down(): void
    {
        Schema::table('words', function (Blueprint $table): void {
            $table->dropColumn('definition_pt');
        });
    }
};
