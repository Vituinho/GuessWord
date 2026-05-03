<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('words', function (Blueprint $table): void {
            $table->id();
            $table->string('word')->unique();
            $table->text('definition');
            $table->text('example');
            $table->string('level', 2)->index();
            $table->string('part_of_speech')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('words');
    }
};
