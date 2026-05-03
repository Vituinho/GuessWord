<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('word_progress', function (Blueprint $table): void {
            $table->id();
            $table->string('client_id')->index();
            $table->foreignId('word_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('attempts')->default(0);
            $table->unsignedInteger('correct_attempts')->default(0);
            $table->unsignedInteger('incorrect_attempts')->default(0);
            $table->unsignedInteger('streak_correct')->default(0);
            $table->unsignedInteger('interval_days')->default(0);
            $table->decimal('ease_factor', 4, 2)->default(2.50);
            $table->boolean('learned')->default(false);
            $table->timestamp('last_answered_at')->nullable();
            $table->timestamp('next_review_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['client_id', 'word_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('word_progress');
    }
};
