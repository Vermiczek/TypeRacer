-- Words dictionary table
create table public.words (
  id serial primary key,
  word text not null unique,
  category text not null check (category in ('noun', 'verb', 'adjective', 'adverb'))
);

alter table public.words enable row level security;
create policy "words_select" on public.words for select using (true);

-- Postgres function to get N random words
create or replace function public.get_random_words(count integer default 10)
returns text[] language sql stable as $$
  select array_agg(word order by random())
  from (
    select word from public.words order by random() limit count
  ) sub;
$$;

-- ── Seed data ────────────────────────────────────────────────────────────────
insert into public.words (word, category) values
-- Nouns
('apple', 'noun'), ('bridge', 'noun'), ('cloud', 'noun'), ('dawn', 'noun'),
('engine', 'noun'), ('forest', 'noun'), ('garden', 'noun'), ('harbor', 'noun'),
('island', 'noun'), ('jungle', 'noun'), ('kitchen', 'noun'), ('lantern', 'noun'),
('mountain', 'noun'), ('notebook', 'noun'), ('ocean', 'noun'), ('palace', 'noun'),
('river', 'noun'), ('shadow', 'noun'), ('temple', 'noun'), ('tower', 'noun'),
('umbrella', 'noun'), ('valley', 'noun'), ('window', 'noun'), ('yacht', 'noun'),
('keyboard', 'noun'), ('ladder', 'noun'), ('mirror', 'noun'), ('needle', 'noun'),
('picture', 'noun'), ('rocket', 'noun'), ('candle', 'noun'), ('desert', 'noun'),
('feather', 'noun'), ('glacier', 'noun'), ('hammer', 'noun'), ('lantern', 'noun'),
('marble', 'noun'), ('pebble', 'noun'), ('quarter', 'noun'), ('ribbon', 'noun'),
('silver', 'noun'), ('thunder', 'noun'), ('volcano', 'noun'), ('whisper', 'noun'),
('blanket', 'noun'), ('compass', 'noun'), ('diamond', 'noun'), ('eclipse', 'noun'),
('fountain', 'noun'), ('horizon', 'noun'), ('iceberg', 'noun'), ('journey', 'noun'),
('lantern', 'noun'), ('meadow', 'noun'), ('network', 'noun'), ('orchard', 'noun'),
('pilgrim', 'noun'), ('quarry', 'noun'), ('summit', 'noun'), ('tunnel', 'noun'),
('voyage', 'noun'), ('walrus', 'noun'), ('zipper', 'noun'), ('anchor', 'noun'),
('beacon', 'noun'), ('castle', 'noun'), ('dagger', 'noun'), ('falcon', 'noun'),
('goblin', 'noun'), ('helmet', 'noun'), ('insect', 'noun'), ('jester', 'noun'),
('kernel', 'noun'), ('lizard', 'noun'), ('magnet', 'noun'), ('napkin', 'noun'),
('oyster', 'noun'), ('parrot', 'noun'), ('rabbit', 'noun'), ('saddle', 'noun'),
('tablet', 'noun'), ('urchin', 'noun'), ('vessel', 'noun'), ('walnut', 'noun'),
('barrel', 'noun'), ('cactus', 'noun'), ('dolphin', 'noun'), ('ember', 'noun'),
('funnel', 'noun'), ('gravel', 'noun'), ('herald', 'noun'), ('inkwell', 'noun'),
-- Verbs
('run', 'verb'), ('jump', 'verb'), ('climb', 'verb'), ('dance', 'verb'),
('explore', 'verb'), ('follow', 'verb'), ('gather', 'verb'), ('hunt', 'verb'),
('improve', 'verb'), ('journey', 'verb'), ('keep', 'verb'), ('launch', 'verb'),
('move', 'verb'), ('navigate', 'verb'), ('observe', 'verb'), ('practice', 'verb'),
('reach', 'verb'), ('search', 'verb'), ('travel', 'verb'), ('unlock', 'verb'),
('venture', 'verb'), ('wander', 'verb'), ('achieve', 'verb'), ('build', 'verb'),
('create', 'verb'), ('discover', 'verb'), ('enhance', 'verb'), ('finish', 'verb'),
('grow', 'verb'), ('handle', 'verb'), ('inspire', 'verb'), ('listen', 'verb'),
('master', 'verb'), ('navigate', 'verb'), ('overcome', 'verb'), ('persist', 'verb'),
('question', 'verb'), ('resolve', 'verb'), ('shape', 'verb'), ('think', 'verb'),
('understand', 'verb'), ('value', 'verb'), ('write', 'verb'), ('analyze', 'verb'),
('balance', 'verb'), ('capture', 'verb'), ('deliver', 'verb'), ('evolve', 'verb'),
('float', 'verb'), ('generate', 'verb'), ('harvest', 'verb'), ('imagine', 'verb'),
('kindle', 'verb'), ('lean', 'verb'), ('measure', 'verb'), ('notice', 'verb'),
('open', 'verb'), ('polish', 'verb'), ('recall', 'verb'), ('sketch', 'verb'),
('trace', 'verb'), ('unfold', 'verb'), ('visit', 'verb'), ('watch', 'verb'),
-- Adjectives
('brave', 'adjective'), ('calm', 'adjective'), ('daring', 'adjective'), ('eager', 'adjective'),
('fierce', 'adjective'), ('gentle', 'adjective'), ('humble', 'adjective'), ('icy', 'adjective'),
('jovial', 'adjective'), ('keen', 'adjective'), ('lively', 'adjective'), ('mighty', 'adjective'),
('noble', 'adjective'), ('odd', 'adjective'), ('proud', 'adjective'), ('quiet', 'adjective'),
('rapid', 'adjective'), ('sharp', 'adjective'), ('tender', 'adjective'), ('unique', 'adjective'),
('vivid', 'adjective'), ('wild', 'adjective'), ('ancient', 'adjective'), ('bold', 'adjective'),
('clever', 'adjective'), ('dusty', 'adjective'), ('elegant', 'adjective'), ('frosty', 'adjective'),
('golden', 'adjective'), ('hollow', 'adjective'), ('immense', 'adjective'), ('jagged', 'adjective'),
('luminous', 'adjective'), ('murky', 'adjective'), ('narrow', 'adjective'), ('obscure', 'adjective'),
('polished', 'adjective'), ('rugged', 'adjective'), ('scarlet', 'adjective'), ('twisted', 'adjective'),
('unknown', 'adjective'), ('vibrant', 'adjective'), ('winding', 'adjective'), ('yellow', 'adjective'),
('agile', 'adjective'), ('brittle', 'adjective'), ('crisp', 'adjective'), ('dense', 'adjective'),
('electric', 'adjective'), ('fragile', 'adjective'), ('grand', 'adjective'), ('hasty', 'adjective'),
('infinite', 'adjective'), ('jolly', 'adjective'), ('lavish', 'adjective'), ('massive', 'adjective'),
('nervous', 'adjective'), ('opaque', 'adjective'), ('pristine', 'adjective'), ('restless', 'adjective'),
('serene', 'adjective'), ('thick', 'adjective'), ('uneven', 'adjective'), ('vacant', 'adjective'),
-- Adverbs
('quickly', 'adverb'), ('slowly', 'adverb'), ('carefully', 'adverb'), ('boldly', 'adverb'),
('quietly', 'adverb'), ('swiftly', 'adverb'), ('calmly', 'adverb'), ('deeply', 'adverb'),
('eagerly', 'adverb'), ('firmly', 'adverb'), ('gently', 'adverb'), ('happily', 'adverb'),
('intensely', 'adverb'), ('kindly', 'adverb'), ('loudly', 'adverb'), ('nearly', 'adverb'),
('often', 'adverb'), ('precisely', 'adverb'), ('rarely', 'adverb'), ('softly', 'adverb'),
('truly', 'adverb'), ('usually', 'adverb'), ('vividly', 'adverb'), ('warmly', 'adverb'),
('always', 'adverb'), ('barely', 'adverb'), ('clearly', 'adverb'), ('directly', 'adverb'),
('endlessly', 'adverb'), ('freely', 'adverb'), ('gracefully', 'adverb'), ('hardly', 'adverb'),
('instantly', 'adverb'), ('justly', 'adverb'), ('mostly', 'adverb'), ('never', 'adverb'),
('openly', 'adverb'), ('patiently', 'adverb'), ('readily', 'adverb'), ('silently', 'adverb')
on conflict (word) do nothing;
