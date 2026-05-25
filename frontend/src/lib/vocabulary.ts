export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type PracticeMode = "auto" | "level" | "review" | "seen";

export type VocabWord = {
  id: number;
  word: string;
  definition: string;
  example: string;
  example_with_blank: string;
  level: Level;
  part_of_speech?: string | null;
};

export type WordProgress = {
  attempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  streakCorrect: number;
  intervalDays: number;
  easeFactor: number;
  learned: boolean;
  lastAnsweredAt: string | null;
  nextReviewAt: string | null;
};

export type HistoryItem = {
  id: string;
  word: string;
  level: Level;
  answer: string;
  correct: boolean;
  score: number;
  mode: PracticeMode;
  studiedAt: string;
};

export type StudyState = {
  clientId: string;
  wordProgress: Record<string, WordProgress>;
  history: HistoryItem[];
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null;
  totalAttempts: number;
  correctAttempts: number;
};

type RawWord = [string, string, string, Level, string];

export const levels: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const modeLabels: Record<PracticeMode, string> = {
  auto: "Progressao",
  level: "Nivel",
  review: "Revisao",
  seen: "Ja vistas",
};

const rawWords: RawWord[] = [
  ["apple", "A round fruit with red, green, or yellow skin.", "She packed an apple for lunch.", "A1", "noun"],
  ["book", "A set of written pages that you read.", "He opened the book before class.", "A1", "noun"],
  ["city", "A large town where many people live and work.", "The city is busy in the morning.", "A1", "noun"],
  ["family", "A group of people related to each other.", "My family eats dinner together.", "A1", "noun"],
  ["friend", "A person you like and know well.", "Her friend helped with the homework.", "A1", "noun"],
  ["happy", "Feeling good or pleased.", "The children were happy at the party.", "A1", "adjective"],
  ["listen", "To give attention to a sound or speaker.", "Please listen to the question carefully.", "A1", "verb"],
  ["morning", "The early part of the day.", "I drink water every morning.", "A1", "noun"],
  ["school", "A place where students learn.", "They walk to school at eight.", "A1", "noun"],
  ["water", "A clear liquid that people drink.", "She drinks water after running.", "A1", "noun"],
  ["chair", "A seat for one person.", "The chair is next to the window.", "A1", "noun"],
  ["door", "A thing you open to enter or leave a room.", "Please close the door quietly.", "A1", "noun"],
  ["food", "Things people or animals eat.", "The food smells good today.", "A1", "noun"],
  ["house", "A building where people live.", "Their house has a small garden.", "A1", "noun"],
  ["mother", "A female parent.", "My mother works at the hospital.", "A1", "noun"],
  ["music", "Sounds made by voices or instruments.", "We listen to music after dinner.", "A1", "noun"],
  ["phone", "A device used to call or message people.", "His phone is on the table.", "A1", "noun"],
  ["picture", "An image, drawing, or photograph.", "She took a picture of the beach.", "A1", "noun"],
  ["table", "A piece of furniture with a flat top.", "Put the keys on the table.", "A1", "noun"],
  ["work", "A job or activity that needs effort.", "He goes to work by bus.", "A1", "noun"],
  ["borrow", "To use something and give it back later.", "Can I borrow your pen for a minute?", "A2", "verb"],
  ["careful", "Taking time to avoid mistakes or danger.", "Be careful when you cross the street.", "A2", "adjective"],
  ["decide", "To choose after thinking about options.", "We need to decide where to eat.", "A2", "verb"],
  ["explain", "To make something clear or easy to understand.", "The teacher will explain the rule again.", "A2", "verb"],
  ["healthy", "Good for your body or not sick.", "A healthy breakfast gives you energy.", "A2", "adjective"],
  ["improve", "To become better or make something better.", "Daily practice can improve your English.", "A2", "verb"],
  ["mistake", "Something that is not correct.", "I made a mistake in the last sentence.", "A2", "noun"],
  ["simple", "Easy to understand or do.", "The instructions are simple and clear.", "A2", "adjective"],
  ["travel", "To go from one place to another.", "They travel by train on weekends.", "A2", "verb"],
  ["weather", "The temperature, wind, rain, or sun outside.", "The weather is colder today.", "A2", "noun"],
  ["arrive", "To reach a place.", "The train will arrive before noon.", "A2", "verb"],
  ["choose", "To pick one thing from several options.", "You can choose a topic for homework.", "A2", "verb"],
  ["describe", "To say what something or someone is like.", "Can you describe your new apartment?", "A2", "verb"],
  ["favorite", "Liked more than others.", "Blue is her favorite color.", "A2", "adjective"],
  ["invite", "To ask someone to come to an event.", "They will invite us to the party.", "A2", "verb"],
  ["journey", "A trip from one place to another.", "The journey took three hours by car.", "A2", "noun"],
  ["noisy", "Making a lot of sound.", "The noisy street made it hard to sleep.", "A2", "adjective"],
  ["protect", "To keep someone or something safe.", "A coat can protect you from the rain.", "A2", "verb"],
  ["repair", "To fix something that is broken.", "He will repair the bike this weekend.", "A2", "verb"],
  ["useful", "Helpful or practical.", "This map is useful in a new city.", "A2", "adjective"],
  ["achieve", "To succeed in doing something after effort.", "She worked hard to achieve her goal.", "B1", "verb"],
  ["benefit", "A good effect or advantage.", "One benefit of reading is a larger vocabulary.", "B1", "noun"],
  ["confident", "Feeling sure about your ability.", "He felt confident before the interview.", "B1", "adjective"],
  ["manage", "To control or organize something successfully.", "They manage the project with a small team.", "B1", "verb"],
  ["opinion", "What someone thinks or believes about something.", "In my opinion, the plan is realistic.", "B1", "noun"],
  ["prevent", "To stop something from happening.", "A helmet can prevent serious injury.", "B1", "verb"],
  ["reduce", "To make something smaller or less.", "We should reduce the amount of waste.", "B1", "verb"],
  ["reliable", "Able to be trusted or depended on.", "This is a reliable source of information.", "B1", "adjective"],
  ["struggle", "To have difficulty doing something.", "Many students struggle with pronunciation.", "B1", "verb"],
  ["support", "To help someone or agree with an idea.", "Her parents support her decision.", "B1", "verb"],
  ["approach", "A way of doing or thinking about something.", "Her approach to study is very organized.", "B1", "noun"],
  ["balance", "A state where different things have the right amount.", "Good balance helps you study and rest.", "B1", "noun"],
  ["compare", "To look at two things and see similarities or differences.", "Compare the answers before you choose.", "B1", "verb"],
  ["develop", "To grow or become more advanced.", "You can develop confidence through practice.", "B1", "verb"],
  ["encourage", "To give someone hope or confidence.", "Teachers encourage students to speak more.", "B1", "verb"],
  ["focus", "To give attention to one thing.", "Focus on the words you often forget.", "B1", "verb"],
  ["involve", "To include someone or something.", "The task will involve reading and speaking.", "B1", "verb"],
  ["likely", "Expected to happen or be true.", "A short review is likely to help.", "B1", "adjective"],
  ["recognize", "To know someone or something from before.", "I recognize this word from yesterday.", "B1", "verb"],
  ["suggest", "To offer an idea or plan.", "I suggest a shorter practice session.", "B1", "verb"],
  ["accomplish", "To complete something successfully.", "The team hopes to accomplish the task today.", "B2", "verb"],
  ["challenge", "A difficult task that tests ability.", "Learning ten new words a day is a challenge.", "B2", "noun"],
  ["consequence", "A result of an action or situation.", "The consequence of missing practice was clear.", "B2", "noun"],
  ["estimate", "To guess an amount based on available information.", "We estimate the lesson will take twenty minutes.", "B2", "verb"],
  ["evidence", "Facts or signs that show something is true.", "The report provides evidence for the claim.", "B2", "noun"],
  ["maintain", "To keep something at the same level or condition.", "You need regular practice to maintain fluency.", "B2", "verb"],
  ["negotiate", "To discuss in order to reach an agreement.", "They negotiate the price before signing.", "B2", "verb"],
  ["prioritize", "To decide what is most important.", "Students should prioritize the words they often miss.", "B2", "verb"],
  ["remarkable", "Unusual or impressive in a way people notice.", "Her progress this month was remarkable.", "B2", "adjective"],
  ["sustainable", "Able to continue for a long time without harm.", "A sustainable study routine is better than cramming.", "B2", "adjective"],
  ["accurate", "Correct and without mistakes.", "An accurate answer earns more points.", "B2", "adjective"],
  ["adapt", "To change in order to fit a new situation.", "Good learners adapt their routine over time.", "B2", "verb"],
  ["convince", "To make someone believe or agree.", "The data can convince them to continue.", "B2", "verb"],
  ["evaluate", "To judge the value or quality of something.", "Evaluate your mistakes after each round.", "B2", "verb"],
  ["framework", "A basic structure for ideas or work.", "The framework helps organize the lesson.", "B2", "noun"],
  ["generate", "To produce or create something.", "The app can generate a new challenge.", "B2", "verb"],
  ["insight", "A clear understanding of something.", "The feedback gave her insight into grammar.", "B2", "noun"],
  ["objective", "A goal or purpose.", "The objective is to remember words faster.", "B2", "noun"],
  ["resolve", "To solve a problem or difficulty.", "They resolve confusion by checking examples.", "B2", "verb"],
  ["tension", "A feeling of stress or pressure.", "Time limits add tension to the game.", "B2", "noun"],
  ["ambiguous", "Having more than one possible meaning.", "The ambiguous sentence confused the class.", "C1", "adjective"],
  ["coherent", "Clear, logical, and easy to understand.", "Her argument was coherent and persuasive.", "C1", "adjective"],
  ["compelling", "Very interesting or convincing.", "The speaker gave a compelling reason to continue.", "C1", "adjective"],
  ["concise", "Using few words while staying clear.", "A concise answer is often more effective.", "C1", "adjective"],
  ["deteriorate", "To become worse over time.", "Without practice, pronunciation can deteriorate.", "C1", "verb"],
  ["implement", "To put a plan or system into action.", "The school will implement a new study plan.", "C1", "verb"],
  ["leverage", "To use something effectively to get a result.", "You can leverage daily habits to learn faster.", "C1", "verb"],
  ["mitigate", "To make a problem less serious.", "Short reviews can mitigate forgetting.", "C1", "verb"],
  ["resilient", "Able to recover quickly after difficulty.", "A resilient learner keeps going after mistakes.", "C1", "adjective"],
  ["substantial", "Large in amount, value, or importance.", "She made substantial progress in six weeks.", "C1", "adjective"],
  ["allocate", "To decide how resources or time should be used.", "Allocate ten minutes to review difficult words.", "C1", "verb"],
  ["articulate", "To express an idea clearly.", "She can articulate complex ideas in English.", "C1", "verb"],
  ["constraint", "A limit or restriction.", "A time constraint can sharpen your focus.", "C1", "noun"],
  ["cultivate", "To develop a skill or habit carefully.", "Cultivate curiosity when you meet new words.", "C1", "verb"],
  ["diminish", "To become or make something smaller.", "Regular review can diminish repeated mistakes.", "C1", "verb"],
  ["formulate", "To create or prepare something carefully.", "Formulate a sentence before you answer.", "C1", "verb"],
  ["inherent", "Existing as a natural part of something.", "There is inherent uncertainty in translation.", "C1", "adjective"],
  ["pragmatic", "Focused on practical results.", "A pragmatic plan fits your real schedule.", "C1", "adjective"],
  ["refine", "To improve something by making small changes.", "Refine your answer after reading the clue.", "C1", "verb"],
  ["scrutiny", "Careful and detailed examination.", "Every example sentence received scrutiny.", "C1", "noun"],
  ["ephemeral", "Lasting for only a short time.", "Motivation can be ephemeral without a clear routine.", "C2", "adjective"],
  ["exacerbate", "To make a bad situation worse.", "Skipping review can exacerbate memory gaps.", "C2", "verb"],
  ["incongruous", "Strange because it does not fit with its surroundings.", "The formal phrase felt incongruous in casual speech.", "C2", "adjective"],
  ["meticulous", "Very careful and attentive to detail.", "A meticulous learner checks each pronunciation.", "C2", "adjective"],
  ["nuance", "A small but important difference in meaning.", "The nuance between the two verbs is subtle.", "C2", "noun"],
  ["paradigm", "A typical model or way of thinking about something.", "Spaced repetition changed the paradigm of memorization.", "C2", "noun"],
  ["proliferation", "A rapid increase in the number of something.", "The proliferation of apps gives learners many choices.", "C2", "noun"],
  ["scrutinize", "To examine something very carefully.", "Advanced students scrutinize word choice in essays.", "C2", "verb"],
  ["ubiquitous", "Present or found everywhere.", "English words are ubiquitous in technology.", "C2", "adjective"],
  ["unequivocal", "Clear and leaving no doubt.", "The feedback was unequivocal after the wrong answer.", "C2", "adjective"],
  ["aberration", "Something unusual that differs from what is normal.", "One low score was an aberration in her record.", "C2", "noun"],
  ["conflate", "To combine two ideas as if they were the same.", "Writers sometimes conflate similar concepts.", "C2", "verb"],
  ["dissonance", "A lack of agreement or harmony.", "The phrase created dissonance in the paragraph.", "C2", "noun"],
  ["intractable", "Very difficult to control or solve.", "The intractable error required deeper analysis.", "C2", "adjective"],
  ["labyrinthine", "Complicated and confusing like a maze.", "The labyrinthine explanation lost the audience.", "C2", "adjective"],
  ["obfuscate", "To make something unclear or hard to understand.", "Do not obfuscate a simple argument.", "C2", "verb"],
  ["perfunctory", "Done quickly and without real care.", "A perfunctory review rarely fixes weak vocabulary.", "C2", "adjective"],
  ["quintessential", "Representing the most typical example.", "That sentence is a quintessential formal opening.", "C2", "adjective"],
  ["tacit", "Understood without being directly said.", "The tacit rule was clear from context.", "C2", "adjective"],
  ["vindicate", "To prove that someone or something was right.", "The final score can vindicate steady practice.", "C2", "verb"],
];

const portugueseDefinitions: Record<string, string> = {
  apple: 'Uma fruta redonda com casca vermelha, verde ou amarela.',
  book: 'Um conjunto de páginas escritas que você lê.',
  city: 'Uma cidade grande onde muitas pessoas vivem e trabalham.',
  family: 'Um grupo de pessoas relacionadas entre si.',
  friend: 'Uma pessoa que você gosta e conhece bem.',
  happy: 'Sentir-se bem ou satisfeito.',
  listen: 'Dar atenção a um som ou a alguém que fala.',
  morning: 'A parte cedo do dia.',
  school: 'Um lugar onde os alunos aprendem.',
  water: 'Um líquido claro que as pessoas bebem.',
  chair: 'Um assento para uma pessoa.',
  door: 'Uma coisa que você abre para entrar ou sair de um cômodo.',
  food: 'Coisas que pessoas ou animais comem.',
  house: 'Um prédio onde as pessoas moram.',
  mother: 'Uma parental feminina.',
  music: 'Sons feitos por vozes ou instrumentos.',
  phone: 'Um aparelho usado para ligar ou mandar mensagem.',
  picture: 'Uma imagem, desenho ou fotografia.',
  table: 'Um móvel com uma superfície plana.',
  work: 'Um trabalho ou atividade que exige esforço.',
  borrow: 'Usar algo e devolver depois.',
  careful: 'Tomar cuidado para evitar erros ou perigo.',
  decide: 'Escolher depois de pensar nas opções.',
  explain: 'Fazer algo claro ou fácil de entender.',
  healthy: 'Bom para o corpo ou não doente.',
  improve: 'Ficar melhor ou fazer algo melhor.',
  mistake: 'Algo que não está correto.',
  simple: 'Fácil de entender ou fazer.',
  travel: 'Ir de um lugar para outro.',
  weather: 'A temperatura, vento, chuva ou sol do lado de fora.',
  arrive: 'Chegar a um lugar.',
  choose: 'Selecionar uma coisa entre várias opções.',
  describe: 'Dizer como algo ou alguém é.',
  favorite: 'Gostado mais do que os outros.',
  invite: 'Pedir que alguém venha para um evento.',
  journey: 'Uma viagem de um lugar a outro.',
  noisy: 'Fazendo muito barulho.',
  protect: 'Manter alguém ou algo seguro.',
  repair: 'Consertar algo que está quebrado.',
  useful: 'Útil ou prático.',
  achieve: 'Conseguir fazer algo com esforço.',
  benefit: 'Um efeito bom ou vantagem.',
  confident: 'Sentir-se seguro sobre sua habilidade.',
  manage: 'Controlar ou organizar algo com sucesso.',
  opinion: 'O que alguém pensa ou acredita sobre algo.',
  prevent: 'Impedir que algo aconteça.',
  reduce: 'Tornar algo menor ou menos.',
  reliable: 'Capaz de ser confiável ou dependente.',
  struggle: 'Ter dificuldade para fazer algo.',
  support: 'Ajudar alguém ou concordar com uma ideia.',
  approach: 'Uma maneira de fazer ou pensar sobre algo.',
  balance: 'Um estado em que diferentes coisas têm a quantidade certa.',
  compare: 'Olhar duas coisas e ver semelhanças ou diferenças.',
  develop: 'Crescer ou tornar-se mais avançado.',
  encourage: 'Dar esperança ou confiança a alguém.',
  focus: 'Dar atenção a uma coisa.',
  involve: 'Incluir alguém ou algo.',
  likely: 'Esperado de acontecer ou ser verdade.',
  recognize: 'Conhecer alguém ou algo de antes.',
  suggest: 'Oferecer uma ideia ou plano.',
  accomplish: 'Completar algo com sucesso.',
  challenge: 'Uma tarefa difícil que testa habilidade.',
  consequence: 'Um resultado de uma ação ou situação.',
  estimate: 'Adivinhar um valor com base nas informações disponíveis.',
  evidence: 'Fatos ou sinais que mostram que algo é verdadeiro.',
  maintain: 'Manter algo no mesmo nível ou condição.',
  negotiate: 'Discutir para chegar a um acordo.',
  prioritize: 'Decidir o que é mais importante.',
  remarkable: 'Incomum ou impressionante de forma que as pessoas notam.',
  sustainable: 'Capaz de continuar por muito tempo sem causar dano.',
  accurate: 'Correto e sem erros.',
  adapt: 'Mudar para se ajustar a uma nova situação.',
  convince: 'Fazer alguém acreditar ou concordar.',
  evaluate: 'Julgar o valor ou qualidade de algo.',
  framework: 'Uma estrutura básica para ideias ou trabalho.',
  generate: 'Produzir ou criar algo.',
  insight: 'Uma compreensão clara de algo.',
  objective: 'Um objetivo ou propósito.',
  resolve: 'Resolver um problema ou dificuldade.',
  tension: 'Uma sensação de estresse ou pressão.',
  ambiguous: 'Tendo mais de um significado possível.',
  coherent: 'Claro, lógico e fácil de entender.',
  compelling: 'Muito interessante ou convincente.',
  concise: 'Usar poucas palavras mantendo clareza.',
  deteriorate: 'Ficar pior ao longo do tempo.',
  implement: 'Colocar um plano ou sistema em ação.',
  leverage: 'Usar algo de forma eficaz para obter um resultado.',
  mitigate: 'Tornar um problema menos grave.',
  resilient: 'Capaz de se recuperar rapidamente após dificuldade.',
  substantial: 'Grande em quantidade, valor ou importância.',
  allocate: 'Decidir como recursos ou tempo devem ser usados.',
  articulate: 'Expressar uma ideia claramente.',
  constraint: 'Um limite ou restrição.',
  cultivate: 'Desenvolver uma habilidade ou hábito com cuidado.',
  diminish: 'Ficar ou fazer algo menor.',
  formulate: 'Criar ou preparar algo cuidadosamente.',
  inherent: 'Existente como parte natural de algo.',
  pragmatic: 'Focado em resultados práticos.',
  refine: 'Melhorar algo fazendo pequenas mudanças.',
  scrutiny: 'Exame cuidadoso e detalhado.',
  ephemeral: 'Durar apenas por um curto período.',
  exacerbate: 'Tornar uma situação ruim pior.',
  incongruous: 'Estranho porque não se encaixa no ambiente.',
  meticulous: 'Muito cuidadoso e atento aos detalhes.',
  nuance: 'Uma pequena, mas importante diferença de significado.',
  paradigm: 'Um modelo típico ou maneira de pensar sobre algo.',
  proliferation: 'Um aumento rápido no número de algo.',
  scrutinize: 'Examinar algo com muita atenção.',
  ubiquitous: 'Presente ou encontrado em todos os lugares.',
  unequivocal: 'Claro e sem deixar dúvida.',
  aberration: 'Algo incomum que difere do normal.',
  conflate: 'Combinar duas ideias como se fossem a mesma.',
  dissonance: 'Falta de acordo ou harmonia.',
  intractable: 'Muito difícil de controlar ou resolver.',
  labyrinthine: 'Complicado e confuso como um labirinto.',
  obfuscate: 'Tornar algo pouco claro ou difícil de entender.',
  perfunctory: 'Feito rapidamente e sem cuidado real.',
  quintessential: 'Representando o exemplo mais típico.',
  tacit: 'Entendido sem ser dito diretamente.',
  vindicate: 'Provar que alguém ou algo estava certo.',
};

export const fallbackWords: VocabWord[] = rawWords.map(
  ([word, definition, example, level, partOfSpeech], index) => ({
    id: index + 1,
    word,
    definition: portugueseDefinitions[word] ?? definition,
    example,
    example_with_blank: blankExample(example, word),
    level,
    part_of_speech: partOfSpeech,
  }),
);

export function createEmptyStudyState(clientId = ""): StudyState {
  return {
    clientId,
    wordProgress: {},
    history: [],
    xp: 0,
    level: 1,
    currentStreak: 0,
    bestStreak: 0,
    lastStudyDate: null,
    totalAttempts: 0,
    correctAttempts: 0,
  };
}

export function blankExample(example: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return example.replace(new RegExp(`\\b${escaped}\\b`, "i"), "_____");
}

export function normalizeAnswer(answer: string): string {
  return answer.toLowerCase().trim().replace(/[^a-z]/g, "");
}

export function scrambleWord(word: string): string[] {
  const letters = word.split("");

  for (let i = letters.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  if (letters.join("") === word && letters.length > 2) {
    [letters[0], letters[1]] = [letters[1], letters[0]];
  }

  return letters;
}

export function isDue(progress?: WordProgress, now = new Date()): boolean {
  if (!progress?.nextReviewAt) {
    return false;
  }

  return new Date(progress.nextReviewAt).getTime() <= now.getTime();
}

export function selectNextWord(
  words: VocabWord[],
  level: Level,
  mode: PracticeMode,
  progress: Record<string, WordProgress>,
  avoidWordId?: number | null,
): VocabWord | null {
  const sameLevel = words.filter((word) => word.level === level);
  const due = words.filter((word) => isDue(progress[word.id]));
  let candidates = sameLevel;

  if (mode === "review") {
    candidates = sameLevel.filter((word) => {
      const item = progress[word.id];
      return isDue(item) || (item?.incorrectAttempts ?? 0) > (item?.correctAttempts ?? 0);
    });
  }

  if (mode === "seen") {
    candidates = sameLevel.filter((word) => (progress[word.id]?.attempts ?? 0) > 0);
  }

  if (mode === "auto") {
    candidates = due.length > 0 ? due : sameLevel.filter((word) => !progress[word.id]?.learned);
  }

  if (candidates.length === 0) {
    candidates = sameLevel.length > 0 ? sameLevel : words;
  }

  const filtered = candidates.length > 1 ? candidates.filter((word) => word.id !== avoidWordId) : candidates;
  const weighted = filtered.map((word) => {
    const item = progress[word.id];
    let weight = 2;

    if (!item) {
      weight += mode === "review" ? 0 : 3;
    } else {
      weight += Math.min(12, item.incorrectAttempts * 3);
      weight += Math.max(0, 3 - item.streakCorrect);
      weight += isDue(item) ? 8 : 0;
      weight -= item.learned ? 1 : 0;
    }

    return { word, weight: Math.max(1, weight) };
  });

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of weighted) {
    roll -= item.weight;

    if (roll <= 0) {
      return item.word;
    }
  }

  return weighted[0]?.word ?? null;
}

export function calculateScore(level: Level, seconds: number, hintsUsed: boolean, combo: number): number {
  const baseByLevel: Record<Level, number> = {
    A1: 8,
    A2: 10,
    B1: 12,
    B2: 15,
    C1: 18,
    C2: 22,
  };
  const speedBonus = Math.max(0, 20 - Math.min(20, seconds));
  const comboBonus = Math.min(20, combo * 2);
  const score = baseByLevel[level] + speedBonus + comboBonus;

  return hintsUsed ? Math.ceil(score * 0.7) : score;
}

export function dateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function yesterdayKey(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return dateKey(yesterday);
}

export function addMinutes(date: Date, minutes: number): string {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() + minutes);

  return copy.toISOString();
}

export function addDays(date: Date, days: number): string {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);

  return copy.toISOString();
}
