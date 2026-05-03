<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('multiplayer_rooms', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 8)->unique();
            $table->string('host_client_id');
            $table->string('level', 2)->default('A1');
            $table->string('status')->default('waiting');
            $table->unsignedInteger('round_seconds')->default(30);
            $table->foreignId('current_word_id')->nullable()->constrained('words')->nullOnDelete();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('multiplayer_rooms');
    }
};
