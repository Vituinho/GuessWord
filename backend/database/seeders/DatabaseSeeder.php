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
            ['word' => 'chair', 'definition' => 'A seat for one person.', 'example' => 'The chair is next to the window.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'door', 'definition' => 'A thing you open to enter or leave a room.', 'example' => 'Please close the door quietly.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'food', 'definition' => 'Things people or animals eat.', 'example' => 'The food smells good today.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'house', 'definition' => 'A building where people live.', 'example' => 'Their house has a small garden.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'mother', 'definition' => 'A female parent.', 'example' => 'My mother works at the hospital.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'music', 'definition' => 'Sounds made by voices or instruments.', 'example' => 'We listen to music after dinner.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'phone', 'definition' => 'A device used to call or message people.', 'example' => 'His phone is on the table.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'picture', 'definition' => 'An image, drawing, or photograph.', 'example' => 'She took a picture of the beach.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'table', 'definition' => 'A piece of furniture with a flat top.', 'example' => 'Put the keys on the table.', 'level' => 'A1', 'part_of_speech' => 'noun'],
            ['word' => 'work', 'definition' => 'A job or activity that needs effort.', 'example' => 'He goes to work by bus.', 'level' => 'A1', 'part_of_speech' => 'noun'],

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
            ['word' => 'arrive', 'definition' => 'To reach a place.', 'example' => 'The train will arrive before noon.', 'level' => 'A2', 'part_of_speech' => 'verb'],
            ['word' => 'choose', 'definition' => 'To pick one thing from several options.', 'example' => 'You can choose a topic for homework.', 'level' => 'A2', 'part_of_speech' => 'verb'],
            ['word' => 'describe', 'definition' => 'To say what something or someone is like.', 'example' => 'Can you describe your new apartment?', 'level' => 'A2', 'part_of_speech' => 'verb'],
            ['word' => 'favorite', 'definition' => 'Liked more than others.', 'example' => 'Blue is her favorite color.', 'level' => 'A2', 'part_of_speech' => 'adjective'],
            ['word' => 'invite', 'definition' => 'To ask someone to come to an event.', 'example' => 'They will invite us to the party.', 'level' => 'A2', 'part_of_speech' => 'verb'],
            ['word' => 'journey', 'definition' => 'A trip from one place to another.', 'example' => 'The journey took three hours by car.', 'level' => 'A2', 'part_of_speech' => 'noun'],
            ['word' => 'noisy', 'definition' => 'Making a lot of sound.', 'example' => 'The noisy street made it hard to sleep.', 'level' => 'A2', 'part_of_speech' => 'adjective'],
            ['word' => 'protect', 'definition' => 'To keep someone or something safe.', 'example' => 'A coat can protect you from the rain.', 'level' => 'A2', 'part_of_speech' => 'verb'],
            ['word' => 'repair', 'definition' => 'To fix something that is broken.', 'example' => 'He will repair the bike this weekend.', 'level' => 'A2', 'part_of_speech' => 'verb'],
            ['word' => 'useful', 'definition' => 'Helpful or practical.', 'example' => 'This map is useful in a new city.', 'level' => 'A2', 'part_of_speech' => 'adjective'],

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
            ['word' => 'approach', 'definition' => 'A way of doing or thinking about something.', 'example' => 'Her approach to study is very organized.', 'level' => 'B1', 'part_of_speech' => 'noun'],
            ['word' => 'balance', 'definition' => 'A state where different things have the right amount.', 'example' => 'Good balance helps you study and rest.', 'level' => 'B1', 'part_of_speech' => 'noun'],
            ['word' => 'compare', 'definition' => 'To look at two things and see similarities or differences.', 'example' => 'Compare the answers before you choose.', 'level' => 'B1', 'part_of_speech' => 'verb'],
            ['word' => 'develop', 'definition' => 'To grow or become more advanced.', 'example' => 'You can develop confidence through practice.', 'level' => 'B1', 'part_of_speech' => 'verb'],
            ['word' => 'encourage', 'definition' => 'To give someone hope or confidence.', 'example' => 'Teachers encourage students to speak more.', 'level' => 'B1', 'part_of_speech' => 'verb'],
            ['word' => 'focus', 'definition' => 'To give attention to one thing.', 'example' => 'Focus on the words you often forget.', 'level' => 'B1', 'part_of_speech' => 'verb'],
            ['word' => 'involve', 'definition' => 'To include someone or something.', 'example' => 'The task will involve reading and speaking.', 'level' => 'B1', 'part_of_speech' => 'verb'],
            ['word' => 'likely', 'definition' => 'Expected to happen or be true.', 'example' => 'A short review is likely to help.', 'level' => 'B1', 'part_of_speech' => 'adjective'],
            ['word' => 'recognize', 'definition' => 'To know someone or something from before.', 'example' => 'I recognize this word from yesterday.', 'level' => 'B1', 'part_of_speech' => 'verb'],
            ['word' => 'suggest', 'definition' => 'To offer an idea or plan.', 'example' => 'I suggest a shorter practice session.', 'level' => 'B1', 'part_of_speech' => 'verb'],

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
            ['word' => 'accurate', 'definition' => 'Correct and without mistakes.', 'example' => 'An accurate answer earns more points.', 'level' => 'B2', 'part_of_speech' => 'adjective'],
            ['word' => 'adapt', 'definition' => 'To change in order to fit a new situation.', 'example' => 'Good learners adapt their routine over time.', 'level' => 'B2', 'part_of_speech' => 'verb'],
            ['word' => 'convince', 'definition' => 'To make someone believe or agree.', 'example' => 'The data can convince them to continue.', 'level' => 'B2', 'part_of_speech' => 'verb'],
            ['word' => 'evaluate', 'definition' => 'To judge the value or quality of something.', 'example' => 'Evaluate your mistakes after each round.', 'level' => 'B2', 'part_of_speech' => 'verb'],
            ['word' => 'framework', 'definition' => 'A basic structure for ideas or work.', 'example' => 'The framework helps organize the lesson.', 'level' => 'B2', 'part_of_speech' => 'noun'],
            ['word' => 'generate', 'definition' => 'To produce or create something.', 'example' => 'The app can generate a new challenge.', 'level' => 'B2', 'part_of_speech' => 'verb'],
            ['word' => 'insight', 'definition' => 'A clear understanding of something.', 'example' => 'The feedback gave her insight into grammar.', 'level' => 'B2', 'part_of_speech' => 'noun'],
            ['word' => 'objective', 'definition' => 'A goal or purpose.', 'example' => 'The objective is to remember words faster.', 'level' => 'B2', 'part_of_speech' => 'noun'],
            ['word' => 'resolve', 'definition' => 'To solve a problem or difficulty.', 'example' => 'They resolve confusion by checking examples.', 'level' => 'B2', 'part_of_speech' => 'verb'],
            ['word' => 'tension', 'definition' => 'A feeling of stress or pressure.', 'example' => 'Time limits add tension to the game.', 'level' => 'B2', 'part_of_speech' => 'noun'],

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
            ['word' => 'allocate', 'definition' => 'To decide how resources or time should be used.', 'example' => 'Allocate ten minutes to review difficult words.', 'level' => 'C1', 'part_of_speech' => 'verb'],
            ['word' => 'articulate', 'definition' => 'To express an idea clearly.', 'example' => 'She can articulate complex ideas in English.', 'level' => 'C1', 'part_of_speech' => 'verb'],
            ['word' => 'constraint', 'definition' => 'A limit or restriction.', 'example' => 'A time constraint can sharpen your focus.', 'level' => 'C1', 'part_of_speech' => 'noun'],
            ['word' => 'cultivate', 'definition' => 'To develop a skill or habit carefully.', 'example' => 'Cultivate curiosity when you meet new words.', 'level' => 'C1', 'part_of_speech' => 'verb'],
            ['word' => 'diminish', 'definition' => 'To become or make something smaller.', 'example' => 'Regular review can diminish repeated mistakes.', 'level' => 'C1', 'part_of_speech' => 'verb'],
            ['word' => 'formulate', 'definition' => 'To create or prepare something carefully.', 'example' => 'Formulate a sentence before you answer.', 'level' => 'C1', 'part_of_speech' => 'verb'],
            ['word' => 'inherent', 'definition' => 'Existing as a natural part of something.', 'example' => 'There is inherent uncertainty in translation.', 'level' => 'C1', 'part_of_speech' => 'adjective'],
            ['word' => 'pragmatic', 'definition' => 'Focused on practical results.', 'example' => 'A pragmatic plan fits your real schedule.', 'level' => 'C1', 'part_of_speech' => 'adjective'],
            ['word' => 'refine', 'definition' => 'To improve something by making small changes.', 'example' => 'Refine your answer after reading the clue.', 'level' => 'C1', 'part_of_speech' => 'verb'],
            ['word' => 'scrutiny', 'definition' => 'Careful and detailed examination.', 'example' => 'Every example sentence received scrutiny.', 'level' => 'C1', 'part_of_speech' => 'noun'],

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
            ['word' => 'aberration', 'definition' => 'Something unusual that differs from what is normal.', 'example' => 'One low score was an aberration in her record.', 'level' => 'C2', 'part_of_speech' => 'noun'],
            ['word' => 'conflate', 'definition' => 'To combine two ideas as if they were the same.', 'example' => 'Writers sometimes conflate similar concepts.', 'level' => 'C2', 'part_of_speech' => 'verb'],
            ['word' => 'dissonance', 'definition' => 'A lack of agreement or harmony.', 'example' => 'The phrase created dissonance in the paragraph.', 'level' => 'C2', 'part_of_speech' => 'noun'],
            ['word' => 'intractable', 'definition' => 'Very difficult to control or solve.', 'example' => 'The intractable error required deeper analysis.', 'level' => 'C2', 'part_of_speech' => 'adjective'],
            ['word' => 'labyrinthine', 'definition' => 'Complicated and confusing like a maze.', 'example' => 'The labyrinthine explanation lost the audience.', 'level' => 'C2', 'part_of_speech' => 'adjective'],
            ['word' => 'obfuscate', 'definition' => 'To make something unclear or hard to understand.', 'example' => 'Do not obfuscate a simple argument.', 'level' => 'C2', 'part_of_speech' => 'verb'],
            ['word' => 'perfunctory', 'definition' => 'Done quickly and without real care.', 'example' => 'A perfunctory review rarely fixes weak vocabulary.', 'level' => 'C2', 'part_of_speech' => 'adjective'],
            ['word' => 'quintessential', 'definition' => 'Representing the most typical example.', 'example' => 'That sentence is a quintessential formal opening.', 'level' => 'C2', 'part_of_speech' => 'adjective'],
            ['word' => 'tacit', 'definition' => 'Understood without being directly said.', 'example' => 'The tacit rule was clear from context.', 'level' => 'C2', 'part_of_speech' => 'adjective'],
            ['word' => 'vindicate', 'definition' => 'To prove that someone or something was right.', 'example' => 'The final score can vindicate steady practice.', 'level' => 'C2', 'part_of_speech' => 'verb'],
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
