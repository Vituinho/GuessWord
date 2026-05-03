<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('multiplayer_players', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('multiplayer_room_id')->constrained()->cascadeOnDelete();
            $table->string('client_id')->index();
            $table->string('display_name');
            $table->string('nationality')->nullable();
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('combo')->default(0);
            $table->unsignedInteger('attempts')->default(0);
            $table->unsignedInteger('correct_attempts')->default(0);
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['multiplayer_room_id', 'client_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('multiplayer_players');
    }
};
