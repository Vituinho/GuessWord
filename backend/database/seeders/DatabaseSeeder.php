<?php

namespace Database\Seeders;

use App\Models\Word;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $now = now();
        $vocabularyPath = base_path('../frontend/src/lib/vocabulary-data.json');
        $vocabulary = json_decode(file_get_contents($vocabularyPath), true, 512, JSON_THROW_ON_ERROR);

        $words = collect($vocabulary)->map(fn (array $word): array => [
            'word' => $word['word'],
            'definition' => $word['definition'],
            'definition_pt' => $word['definition_pt'],
            'example' => $word['example'],
            'level' => $word['level'],
            'part_of_speech' => $word['part_of_speech'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        Word::upsert(
            $words,
            ['word'],
            ['definition', 'definition_pt', 'example', 'level', 'part_of_speech', 'updated_at']
        );
    }
}
