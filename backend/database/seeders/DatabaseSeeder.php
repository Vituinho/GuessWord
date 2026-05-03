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
        $words = collect([
            ['word' => 'apple', 'definition' => 'A round fruit with red, green, or yellow skin.', 'example' => 'She packed an apple for lunch.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'book', 'definition' => 'A set of written pages that you read.', 'example' => 'He opened the book before class.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'city', 'definition' => 'A large town where many people live and work.', 'example' => 'The city is busy in the morning.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'family', 'definition' => 'A group of people related to each other.', 'example' => 'My family eats dinner together.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'friend', 'definition' => 'A person you like and know well.', 'example' => 'Her friend helped with the homework.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'happy', 'definition' => 'Feeling good or pleased.', 'example' => 'The children were happy at the party.', 'level' => 'A1', 'part_of_speech' => 'adjective'],
            ['word' => 'listen', 'definition' => 'To give attention to a sound or speaker.', 'example' => 'Please listen to the question carefully.', 'level' => 'A1', 'part_of_speech' => 'verb'],
            ['word' => 'morning', 'definition' => 'The early part of the day.', 'example' => 'I drink water every morning.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'school', 'definition' => 'A place where students learn.', 'example' => 'They walk to school at eight.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'water', 'definition' => 'A clear liquid that people drink.', 'example' => 'She drinks water after running.', 'level' => 'A1', 'part_of_speech' => 'noun'],

            ['word' => 'borrow', 'definition' => 'To use something and give it back later.', 'example' => 'Can I borrow your pen for a minute?', 'level' => 'A2', 'part_of_speech' => 'verb'],
            ['word' => 'careful', 'definition' => 'Taking time to avoid mistakes or danger.', 'example' => 'Be careful when you cross the street.', 'level' => 'A2', 'part_of_speech' => 'adjective'],
            ['word' => 'decide', 'definition' => 'To choose after thinking about options.', 'example' => 'We need to decide where to eat.', 'level' => 'A2', 'part_of_speech' => 'verb'],
            ['word' => 'explain', 'definition' => 'To make something clear or easy to understand.', 'example' => 'The teacher will explain the rule again.', 'level' => 'A2', 'part_of_speech' => 'verb'],
            ['word' => 'healthy', 'definition' => 'Good for your body or not sick.', 'example' => 'A healthy breakfast gives you energy.', 'level' => 'A2', 'part_of_speech' => 'adjective'],
            ['word' => 'improve', 'definition' => 'To become better or make something better.', 'example' => 'Daily practice can improve your English.', 'level' => 'A2', 'part_of_speech' => 'verb'],
            ['word' => 'mistake', 'definition' => 'Something that is not correct.', 'example' => 'I made a mistake in the last sentence.', 'level' => 'A2', 'part_of_speech' => 'noun'],
            ['word' => 'simple', 'definition' => 'Easy to understand or do.', 'example' => 'The instructions are simple and clear.', 'level' => 'A2', 'part_of_speech' => 'adjective'],
            ['word' => 'travel', 'definition' => 'To go from one place to another.', 'example' => 'They travel by train on weekends.', 'level' => 'A2', 'part_of_speech' => 'verb'],
            ['word' => 'weather', 'definition' => 'The temperature, wind, rain, or sun outside.', 'example' => 'The weather is colder today.', 'level' => 'A2', 'part_of_speech' => 'noun'],

            ['word' => 'achieve', 'definition' => 'To succeed in doing something after effort.', 'example' => 'She worked hard to achieve her goal.', 'level' => 'B1', 'part_of_speech' => 'verb'],
            ['word' => 'benefit', 'definition' => 'A good effect or advantage.', 'example' => 'One benefit of reading is a larger vocabulary.', 'level' => 'B1', 'part_of_speech' => 'noun'],
            ['word' => 'confident', 'definition' => 'Feeling sure about your ability.', 'example' => 'He felt confident before the interview.', 'level' => 'B1', 'part_of_speech' => 'adjective'],
            ['word' => 'manage', 'definition' => 'To control or organize something successfully.', 'example' => 'They manage the project with a small team.', 'level' => 'B1', 'part_of_speech' => 'verb'],
            ['word' => 'opinion', 'definition' => 'What someone thinks or believes about something.', 'example' => 'In my opinion, the plan is realistic.', 'level' => 'B1', 'part_of_speech' => 'noun'],
            ['word' => 'prevent', 'definition' => 'To stop something from happening.', 'example' => 'A helmet can prevent serious injury.', 'level' => 'B1', 'part_of_speech' => 'verb'],
            ['word' => 'reduce', 'definition' => 'To make something smaller or less.', 'example' => 'We should reduce the amount of waste.', 'level' => 'B1', 'part_of_speech' => 'verb'],
            ['word' => 'reliable', 'definition' => 'Able to be trusted or depended on.', 'example' => 'This is a reliable source of information.', 'level' => 'B1', 'part_of_speech' => 'adjective'],
            ['word' => 'struggle', 'definition' => 'To have difficulty doing something.', 'example' => 'Many students struggle with pronunciation.', 'level' => 'B1', 'part_of_speech' => 'verb'],
            ['word' => 'support', 'definition' => 'To help someone or agree with an idea.', 'example' => 'Her parents support her decision.', 'level' => 'B1', 'part_of_speech' => 'verb'],

            ['word' => 'accomplish', 'definition' => 'To complete something successfully.', 'example' => 'The team hopes to accomplish the task today.', 'level' => 'B2', 'part_of_speech' => 'verb'],
            ['word' => 'challenge', 'definition' => 'A difficult task that tests ability.', 'example' => 'Learning ten new words a day is a challenge.', 'level' => 'B2', 'part_of_speech' => 'noun'],
            ['word' => 'consequence', 'definition' => 'A result of an action or situation.', 'example' => 'The consequence of missing practice was clear.', 'level' => 'B2', 'part_of_speech' => 'noun'],
            ['word' => 'estimate', 'definition' => 'To guess an amount based on available information.', 'example' => 'We estimate the lesson will take twenty minutes.', 'level' => 'B2', 'part_of_speech' => 'verb'],
            ['word' => 'evidence', 'definition' => 'Facts or signs that show something is true.', 'example' => 'The report provides evidence for the claim.', 'level' => 'B2', 'part_of_speech' => 'noun'],
            ['word' => 'maintain', 'definition' => 'To keep something at the same level or condition.', 'example' => 'You need regular practice to maintain fluency.', 'level' => 'B2', 'part_of_speech' => 'verb'],
            ['word' => 'negotiate', 'definition' => 'To discuss in order to reach an agreement.', 'example' => 'They negotiate the price before signing.', 'level' => 'B2', 'part_of_speech' => 'verb'],
            ['word' => 'prioritize', 'definition' => 'To decide what is most important.', 'example' => 'Students should prioritize the words they often miss.', 'level' => 'B2', 'part_of_speech' => 'verb'],
            ['word' => 'remarkable', 'definition' => 'Unusual or impressive in a way people notice.', 'example' => 'Her progress this month was remarkable.', 'level' => 'B2', 'part_of_speech' => 'adjective'],
            ['word' => 'sustainable', 'definition' => 'Able to continue for a long time without harm.', 'example' => 'A sustainable study routine is better than cramming.', 'level' => 'B2', 'part_of_speech' => 'adjective'],

            ['word' => 'ambiguous', 'definition' => 'Having more than one possible meaning.', 'example' => 'The ambiguous sentence confused the class.', 'level' => 'C1', 'part_of_speech' => 'adjective'],
            ['word' => 'coherent', 'definition' => 'Clear, logical, and easy to understand.', 'example' => 'Her argument was coherent and persuasive.', 'level' => 'C1', 'part_of_speech' => 'adjective'],
            ['word' => 'compelling', 'definition' => 'Very interesting or convincing.', 'example' => 'The speaker gave a compelling reason to continue.', 'level' => 'C1', 'part_of_speech' => 'adjective'],
            ['word' => 'concise', 'definition' => 'Using few words while staying clear.', 'example' => 'A concise answer is often more effective.', 'level' => 'C1', 'part_of_speech' => 'adjective'],
            ['word' => 'deteriorate', 'definition' => 'To become worse over time.', 'example' => 'Without practice, pronunciation can deteriorate.', 'level' => 'C1', 'part_of_speech' => 'verb'],
            ['word' => 'implement', 'definition' => 'To put a plan or system into action.', 'example' => 'The school will implement a new study plan.', 'level' => 'C1', 'part_of_speech' => 'verb'],
            ['word' => 'leverage', 'definition' => 'To use something effectively to get a result.', 'example' => 'You can leverage daily habits to learn faster.', 'level' => 'C1', 'part_of_speech' => 'verb'],
            ['word' => 'mitigate', 'definition' => 'To make a problem less serious.', 'example' => 'Short reviews can mitigate forgetting.', 'level' => 'C1', 'part_of_speech' => 'verb'],
            ['word' => 'resilient', 'definition' => 'Able to recover quickly after difficulty.', 'example' => 'A resilient learner keeps going after mistakes.', 'level' => 'C1', 'part_of_speech' => 'adjective'],
            ['word' => 'substantial', 'definition' => 'Large in amount, value, or importance.', 'example' => 'She made substantial progress in six weeks.', 'level' => 'C1', 'part_of_speech' => 'adjective'],

            ['word' => 'ephemeral', 'definition' => 'Lasting for only a short time.', 'example' => 'Motivation can be ephemeral without a clear routine.', 'level' => 'C2', 'part_of_speech' => 'adjective'],
            ['word' => 'exacerbate', 'definition' => 'To make a bad situation worse.', 'example' => 'Skipping review can exacerbate memory gaps.', 'level' => 'C2', 'part_of_speech' => 'verb'],
            ['word' => 'incongruous', 'definition' => 'Strange because it does not fit with its surroundings.', 'example' => 'The formal phrase felt incongruous in casual speech.', 'level' => 'C2', 'part_of_speech' => 'adjective'],
            ['word' => 'meticulous', 'definition' => 'Very careful and attentive to detail.', 'example' => 'A meticulous learner checks each pronunciation.', 'level' => 'C2', 'part_of_speech' => 'adjective'],
            ['word' => 'nuance', 'definition' => 'A small but important difference in meaning.', 'example' => 'The nuance between the two verbs is subtle.', 'level' => 'C2', 'part_of_speech' => 'noun'],
            ['word' => 'paradigm', 'definition' => 'A typical model or way of thinking about something.', 'example' => 'Spaced repetition changed the paradigm of memorization.', 'level' => 'C2', 'part_of_speech' => 'noun'],
            ['word' => 'proliferation', 'definition' => 'A rapid increase in the number of something.', 'example' => 'The proliferation of apps gives learners many choices.', 'level' => 'C2', 'part_of_speech' => 'noun'],
            ['word' => 'scrutinize', 'definition' => 'To examine something very carefully.', 'example' => 'Advanced students scrutinize word choice in essays.', 'level' => 'C2', 'part_of_speech' => 'verb'],
            ['word' => 'ubiquitous', 'definition' => 'Present or found everywhere.', 'example' => 'English words are ubiquitous in technology.', 'level' => 'C2', 'part_of_speech' => 'adjective'],
            ['word' => 'unequivocal', 'definition' => 'Clear and leaving no doubt.', 'example' => 'The feedback was unequivocal after the wrong answer.', 'level' => 'C2', 'part_of_speech' => 'adjective'],
        ])->map(fn (array $word): array => [
            ...$word,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        Word::upsert(
            $words,
            ['word'],
            ['definition', 'example', 'level', 'part_of_speech', 'updated_at']
        );
    }
}
