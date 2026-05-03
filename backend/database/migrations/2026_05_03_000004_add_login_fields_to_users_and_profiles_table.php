<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('public_id')->nullable()->unique()->after('id');
            $table->string('nationality')->nullable()->after('email');
            $table->string('provider')->default('email')->after('nationality');
            $table->string('google_id')->nullable()->unique()->after('provider');
            $table->string('avatar_url')->nullable()->after('google_id');
            $table->timestamp('gmail_connected_at')->nullable()->after('avatar_url');
            $table->string('session_token')->nullable()->unique()->after('remember_token');
        });

        Schema::table('user_profiles', function (Blueprint $table): void {
            $table->unsignedBigInteger('user_id')->nullable()->index()->after('id');
            $table->string('display_name')->nullable()->after('client_id');
            $table->string('nationality')->nullable()->after('display_name');
        });
    }

    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table): void {
            $table->dropColumn(['user_id', 'display_name', 'nationality']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'public_id',
                'nationality',
                'provider',
                'google_id',
                'avatar_url',
                'gmail_connected_at',
                'session_token',
            ]);
        });
    }
};
