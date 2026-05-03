<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('study_attempts', function (Blueprint $table): void {
            $table->id();
            $table->string('client_id')->index();
            $table->foreignId('word_id')->constrained()->cascadeOnDelete();
            $table->string('answer');
            $table->boolean('correct')->index();
            $table->unsignedInteger('seconds_spent')->default(0);
            $table->boolean('hints_used')->default(false);
            $table->string('mode')->default('level');
            $table->integer('score_delta')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_attempts');
    }
};
