-- ============================================================
-- LittleSeed Bible Coloring Sheet Platform
-- Supabase / PostgreSQL Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- accent-insensitive search

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE age_group_enum AS ENUM (
  'toddler',      -- 2–4
  'preschool',    -- 3–5
  'early',        -- 5–7
  'elementary',   -- 7–10
  'tween',        -- 10–13
  'teen',         -- 13–18
  'adult'
);

CREATE TYPE difficulty_enum AS ENUM (
  'very_easy',
  'easy',
  'medium',
  'detailed'
);

-- ============================================================
-- TABLE: languages
-- ============================================================

CREATE TABLE languages (
  code        TEXT PRIMARY KEY,           -- ISO 639-1: 'en', 'ko', 'es', 'fr', 'pt'
  native_name TEXT NOT NULL,
  english_name TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  SMALLINT NOT NULL DEFAULT 0
);

INSERT INTO languages (code, native_name, english_name, sort_order) VALUES
  ('en', 'English',    'English',    1),
  ('ko', '한국어',      'Korean',     2),
  ('es', 'Español',    'Spanish',    3),
  ('fr', 'Français',   'French',     4),
  ('pt', 'Português',  'Portuguese', 5),
  ('ar', 'العربية',    'Arabic',     6),   -- RTL
  ('ps', 'پښتو',       'Pashto',     7),   -- RTL
  ('am', 'አማርኛ',       'Amharic',    8),
  ('mn', 'Монгол',     'Mongolian',  9);

-- ============================================================
-- TABLE: coloring_pages
-- ============================================================

CREATE TABLE coloring_pages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug           TEXT NOT NULL UNIQUE,          -- URL-safe identifier: 'noah-ark-01'
  bible_story    TEXT NOT NULL,                 -- canonical English name
  bible_book     TEXT,                          -- e.g. 'Genesis'
  bible_chapter  SMALLINT,
  bible_verse    TEXT,                          -- e.g. '6:9-22'
  age_group      age_group_enum NOT NULL,
  difficulty     difficulty_enum NOT NULL,
  svg_url        TEXT NOT NULL,                 -- relative path: /coloring/noah/noah-01.svg
  pdf_url        TEXT,                          -- relative path: /coloring/noah/noah-01.pdf
  thumbnail_url  TEXT,                          -- WebP thumbnail
  tags           TEXT[] NOT NULL DEFAULT '{}',
  is_published   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Full-text search vector (English default; per-row boosted)
  search_vector  TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(bible_story, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bible_book, '')),  'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(bible_verse, '')), 'C')
  ) STORED
);

-- GIN index for fast full-text search
CREATE INDEX idx_coloring_pages_search  ON coloring_pages USING GIN (search_vector);
CREATE INDEX idx_coloring_pages_slug    ON coloring_pages (slug);
CREATE INDEX idx_coloring_pages_tags    ON coloring_pages USING GIN (tags);
CREATE INDEX idx_coloring_pages_age     ON coloring_pages (age_group);
CREATE INDEX idx_coloring_pages_pub     ON coloring_pages (is_published);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_coloring_pages_updated_at
  BEFORE UPDATE ON coloring_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: translations
-- ============================================================

CREATE TABLE translations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coloring_page_id UUID NOT NULL REFERENCES coloring_pages(id) ON DELETE CASCADE,
  language_code    TEXT NOT NULL REFERENCES languages(code),
  title            TEXT NOT NULL,
  verse            TEXT NOT NULL,           -- localized scripture text
  description      TEXT,                    -- short teacher note / activity description
  keywords         TEXT[] NOT NULL DEFAULT '{}',  -- localized search keywords

  -- Per-translation search vector (multilingual)
  search_vector    TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', unaccent(coalesce(title, ''))),       'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(verse, ''))),       'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(description, ''))), 'C') ||
    setweight(to_tsvector('simple', unaccent(array_to_string(keywords, ' '))), 'B')
  ) STORED,

  UNIQUE (coloring_page_id, language_code)
);

CREATE INDEX idx_translations_page_lang ON translations (coloring_page_id, language_code);
CREATE INDEX idx_translations_search    ON translations USING GIN (search_vector);
CREATE INDEX idx_translations_lang      ON translations (language_code);

-- ============================================================
-- FULL-TEXT SEARCH FUNCTION
-- Returns coloring pages ranked by relevance, with translation
-- ============================================================

CREATE OR REPLACE FUNCTION search_coloring_pages(
  query_text    TEXT,
  lang_code     TEXT    DEFAULT 'en',
  p_age_group   age_group_enum DEFAULT NULL,
  p_difficulty  difficulty_enum DEFAULT NULL,
  p_limit       INT     DEFAULT 20,
  p_offset      INT     DEFAULT 0
)
RETURNS TABLE (
  id            UUID,
  slug          TEXT,
  bible_story   TEXT,
  age_group     age_group_enum,
  difficulty    difficulty_enum,
  thumbnail_url TEXT,
  svg_url       TEXT,
  tags          TEXT[],
  title         TEXT,
  verse         TEXT,
  rank          FLOAT4
) LANGUAGE sql STABLE AS $$
  SELECT
    cp.id,
    cp.slug,
    cp.bible_story,
    cp.age_group,
    cp.difficulty,
    cp.thumbnail_url,
    cp.svg_url,
    cp.tags,
    t.title,
    t.verse,
    (
      ts_rank(cp.search_vector, websearch_to_tsquery('english', query_text)) * 1.5 +
      ts_rank(t.search_vector,  websearch_to_tsquery('simple',  unaccent(query_text)))
    ) AS rank
  FROM coloring_pages cp
  LEFT JOIN translations t
    ON t.coloring_page_id = cp.id AND t.language_code = lang_code
  WHERE
    cp.is_published = TRUE
    AND (
      query_text IS NULL OR query_text = '' OR
      cp.search_vector @@ websearch_to_tsquery('english', query_text) OR
      t.search_vector  @@ websearch_to_tsquery('simple',  unaccent(query_text))
    )
    AND (p_age_group  IS NULL OR cp.age_group  = p_age_group)
    AND (p_difficulty IS NULL OR cp.difficulty = p_difficulty)
  ORDER BY rank DESC, cp.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE coloring_pages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages        ENABLE ROW LEVEL SECURITY;

-- Public read access (anonymous users can browse)
CREATE POLICY "Public read coloring_pages"
  ON coloring_pages FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Public read translations"
  ON translations FOR SELECT USING (TRUE);

CREATE POLICY "Public read languages"
  ON languages FOR SELECT USING (is_active = TRUE);

-- ============================================================
-- SEED DATA — MOCK COLORING PAGES
-- ============================================================

INSERT INTO coloring_pages
  (slug, bible_story, bible_book, bible_chapter, bible_verse,
   age_group, difficulty, svg_url, pdf_url, thumbnail_url, tags)
VALUES
  (
    'noah-ark-01',
    'Noah and the Ark',
    'Genesis', 6, '6:9-22',
    'early', 'easy',
    '/coloring/noah/noah-ark-01.svg',
    '/coloring/noah/noah-ark-01.pdf',
    '/coloring/noah/noah-ark-01.webp',
    ARRAY['noah','ark','animals','flood','obedience','faith']
  ),
  (
    'david-goliath-01',
    'David and Goliath',
    '1 Samuel', 17, '17:45-50',
    'elementary', 'medium',
    '/coloring/david/david-goliath-01.svg',
    '/coloring/david/david-goliath-01.pdf',
    '/coloring/david/david-goliath-01.webp',
    ARRAY['david','goliath','courage','faith','victory','giant']
  ),
  (
    'jesus-loves-me-01',
    'Jesus Loves the Children',
    'Matthew', 19, '19:14',
    'toddler', 'very_easy',
    '/coloring/jesus/jesus-loves-me-01.svg',
    '/coloring/jesus/jesus-loves-me-01.pdf',
    '/coloring/jesus/jesus-loves-me-01.webp',
    ARRAY['jesus','love','children','blessing','tender']
  ),
  (
    'easter-resurrection-01',
    'The Resurrection',
    'Luke', 24, '24:6-7',
    'early', 'easy',
    '/coloring/easter/easter-resurrection-01.svg',
    '/coloring/easter/easter-resurrection-01.pdf',
    '/coloring/easter/easter-resurrection-01.webp',
    ARRAY['easter','resurrection','empty tomb','hope','life','sunday']
  ),
  (
    'jonah-whale-01',
    'Jonah and the Whale',
    'Jonah', 1, '1:17',
    'preschool', 'very_easy',
    '/coloring/jonah/jonah-whale-01.svg',
    '/coloring/jonah/jonah-whale-01.pdf',
    '/coloring/jonah/jonah-whale-01.webp',
    ARRAY['jonah','whale','fish','obedience','prayer','sea']
  ),
  (
    'good-samaritan-01',
    'The Good Samaritan',
    'Luke', 10, '10:30-37',
    'elementary', 'medium',
    '/coloring/parables/good-samaritan-01.svg',
    '/coloring/parables/good-samaritan-01.pdf',
    '/coloring/parables/good-samaritan-01.webp',
    ARRAY['samaritan','kindness','love','neighbor','parable','helping']
  );

-- ============================================================
-- SEED DATA — TRANSLATIONS (English)
-- ============================================================

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'en',
  'Noah and the Ark',
  '"Noah was a righteous man, blameless among the people of his time, and he walked faithfully with God." — Genesis 6:9',
  'Noah trusted God and built the ark just as God commanded. Color the animals going two by two!',
  ARRAY['noah','ark','flood','obedience','animals','rainbow']
FROM coloring_pages WHERE slug = 'noah-ark-01';

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'en',
  'David and Goliath',
  '"David said to the Philistine, ''You come against me with sword and spear… but I come against you in the name of the LORD.'''" — 1 Samuel 17:45',
  'With just a sling and five smooth stones, David trusted God and defeated the giant Goliath!',
  ARRAY['david','goliath','courage','giant','faith','sling','victory']
FROM coloring_pages WHERE slug = 'david-goliath-01';

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'en',
  'Jesus Loves the Children',
  '"Let the little children come to me, and do not hinder them, for the kingdom of heaven belongs to such as these." — Matthew 19:14',
  'Jesus welcomed every child with open arms. You are loved by Jesus!',
  ARRAY['jesus','love','children','blessing','heaven','welcome']
FROM coloring_pages WHERE slug = 'jesus-loves-me-01';

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'en',
  'The Resurrection',
  '"He is not here; he has risen!" — Luke 24:6',
  'On the first Easter morning, Jesus rose from the dead! The tomb was empty because Jesus is alive!',
  ARRAY['easter','resurrection','risen','tomb','alive','hope','sunday']
FROM coloring_pages WHERE slug = 'easter-resurrection-01';

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'en',
  'Jonah and the Big Fish',
  '"Now the LORD provided a huge fish to swallow Jonah, and Jonah was in the belly of the fish three days and three nights." — Jonah 1:17',
  'God called Jonah but Jonah ran away. God still rescued him from the big fish. Color Jonah inside the whale!',
  ARRAY['jonah','whale','fish','big fish','prayer','three days','obedience']
FROM coloring_pages WHERE slug = 'jonah-whale-01';

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'en',
  'The Good Samaritan',
  '"Which of these three do you think was a neighbor to the man who fell into the hands of robbers?" — Luke 10:36',
  'Jesus taught us to love our neighbors. The Samaritan showed kindness when others walked by. How can you be a good neighbor?',
  ARRAY['samaritan','neighbor','kindness','parable','helping','love','compassion']
FROM coloring_pages WHERE slug = 'good-samaritan-01';

-- ============================================================
-- TRANSLATIONS — Korean (ko)
-- ============================================================

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'ko',
  '노아의 방주',
  '"노아는 의인이요 당대에 완전한 자라 그는 하나님과 동행하였으며" — 창세기 6:9',
  '노아는 하나님을 믿고 방주를 지었어요. 동물들이 두 마리씩 들어가는 모습을 색칠해 보세요!',
  ARRAY['노아','방주','홍수','순종','동물','무지개']
FROM coloring_pages WHERE slug = 'noah-ark-01';

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'ko',
  '다윗과 골리앗',
  '"다윗이 블레셋 사람에게 이르되 너는 칼과 창과 단창으로 내게 나아 오거니와 나는 만군의 여호와의 이름 곧 네가 모욕하는 이스라엘 군대의 하나님의 이름으로 네게 나아가노라" — 사무엘상 17:45',
  '다윗은 하나님을 믿고 작은 돌멩이로 거인 골리앗을 이겼어요!',
  ARRAY['다윗','골리앗','용기','거인','믿음','물매','승리']
FROM coloring_pages WHERE slug = 'david-goliath-01';

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'ko',
  '예수님은 어린이를 사랑하세요',
  '"어린 아이들이 내게 오는 것을 용납하고 금하지 말라 하나님의 나라가 이런 자의 것이니라" — 마태복음 19:14',
  '예수님은 모든 어린이를 두 팔 벌려 환영하셨어요. 예수님은 나를 사랑하세요!',
  ARRAY['예수님','사랑','어린이','축복','천국','환영']
FROM coloring_pages WHERE slug = 'jesus-loves-me-01';

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'ko',
  '부활',
  '"그가 여기 계시지 않고 살아나셨느니라" — 누가복음 24:6',
  '첫 번째 부활절 아침, 예수님이 죽음에서 살아나셨어요! 빈 무덤은 예수님이 살아계심을 보여줘요!',
  ARRAY['부활절','부활','빈 무덤','살아남','소망','일요일']
FROM coloring_pages WHERE slug = 'easter-resurrection-01';

-- ============================================================
-- TRANSLATIONS — Spanish (es)
-- ============================================================

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'es',
  'Noé y el Arca',
  '"Noé era un hombre justo, irreprochable entre la gente de su tiempo, y caminaba fielmente con Dios." — Génesis 6:9',
  'Noé confió en Dios y construyó el arca tal como Dios le ordenó. ¡Colorea los animales entrando de dos en dos!',
  ARRAY['noé','arca','diluvio','obediencia','animales','arcoíris']
FROM coloring_pages WHERE slug = 'noah-ark-01';

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'es',
  'David y Goliat',
  '"David le dijo al filisteo: Tú vienes contra mí con espada… pero yo vengo contra ti en el nombre del SEÑOR." — 1 Samuel 17:45',
  'Con solo una honda y cinco piedras, David confió en Dios y venció al gigante Goliat.',
  ARRAY['david','goliat','valentía','gigante','fe','honda','victoria']
FROM coloring_pages WHERE slug = 'david-goliath-01';

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'es',
  'Jesús Ama a los Niños',
  '"Dejen que los niños vengan a mí, y no se lo impidan, porque el reino de los cielos es de quienes son como ellos." — Mateo 19:14',
  'Jesús recibió a cada niño con los brazos abiertos. ¡Tú eres amado por Jesús!',
  ARRAY['jesús','amor','niños','bendición','cielo','bienvenida']
FROM coloring_pages WHERE slug = 'jesus-loves-me-01';

INSERT INTO translations (coloring_page_id, language_code, title, verse, description, keywords)
SELECT id, 'es',
  'La Resurrección',
  '"No está aquí; ¡ha resucitado!" — Lucas 24:6',
  'En la primera mañana de Pascua, ¡Jesús resucitó de entre los muertos! La tumba estaba vacía porque Jesús está vivo.',
  ARRAY['pascua','resurrección','tumba vacía','resucitado','vivo','esperanza']
FROM coloring_pages WHERE slug = 'easter-resurrection-01';

-- ============================================================
-- POPULAR SEARCHES (for homepage chips)
-- ============================================================

CREATE TABLE popular_searches (
  keyword    TEXT PRIMARY KEY,
  lang_code  TEXT NOT NULL DEFAULT 'en',
  sort_order SMALLINT NOT NULL DEFAULT 0
);

INSERT INTO popular_searches (keyword, lang_code, sort_order) VALUES
  ('Noah',         'en', 1),
  ('Easter',       'en', 2),
  ('Jesus',        'en', 3),
  ('David',        'en', 4),
  ('Love',         'en', 5),
  ('Jonah',        'en', 6),
  ('Forgiveness',  'en', 7),
  ('Christmas',    'en', 8);

ALTER TABLE popular_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read popular_searches"
  ON popular_searches FOR SELECT USING (TRUE);

-- ============================================================
-- AUTH EXTENSION — user profiles
-- ============================================================

-- Public profile (auto-created on first sign-in via trigger)
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'moderator' | 'admin'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read any profile"
  ON user_profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- LIKES
-- ============================================================

CREATE TABLE user_likes (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coloring_page_id  UUID NOT NULL REFERENCES coloring_pages(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, coloring_page_id)
);

CREATE INDEX idx_user_likes_page ON user_likes (coloring_page_id);
CREATE INDEX idx_user_likes_user ON user_likes (user_id);

ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can like"
  ON user_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON user_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read like counts"
  ON user_likes FOR SELECT USING (TRUE);

-- Add denormalised likes_count to coloring_pages for fast sorting
ALTER TABLE coloring_pages ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- Keep likes_count in sync
CREATE OR REPLACE FUNCTION sync_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE coloring_pages SET likes_count = likes_count + 1 WHERE id = NEW.coloring_page_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE coloring_pages SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.coloring_page_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_likes_count
  AFTER INSERT OR DELETE ON user_likes
  FOR EACH ROW EXECUTE FUNCTION sync_likes_count();

-- ============================================================
-- SAVES / BOOKMARKS
-- ============================================================

CREATE TABLE user_saves (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coloring_page_id  UUID NOT NULL REFERENCES coloring_pages(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, coloring_page_id)
);

CREATE INDEX idx_user_saves_user ON user_saves (user_id);

ALTER TABLE user_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saves"
  ON user_saves FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- CONVERSION HISTORY
-- ============================================================

CREATE TABLE user_conversions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  upload_id         TEXT NOT NULL,
  original_filename TEXT,
  title             TEXT,
  verse             TEXT,
  description       TEXT,
  tags              TEXT[] DEFAULT '{}',
  language_code     TEXT DEFAULT 'en',
  print_mode        TEXT DEFAULT 'bw',     -- 'bw' | 'grayscale' | 'outline'
  svg_data          TEXT,                  -- stored SVG string (lightweight)
  thumbnail_url     TEXT,                  -- future: uploaded to Storage
  copyright_status  TEXT DEFAULT 'clear',  -- 'clear' | 'warn' | 'block'
  published         BOOLEAN NOT NULL DEFAULT FALSE,
  coloring_page_id  UUID REFERENCES coloring_pages(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversions_user   ON user_conversions (user_id);
CREATE INDEX idx_conversions_status ON user_conversions (published, copyright_status);

ALTER TABLE user_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversions"
  ON user_conversions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own conversions"
  ON user_conversions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own conversions"
  ON user_conversions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins read all conversions"
  ON user_conversions FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('moderator','admin')));

-- ============================================================
-- RPC: get_sheet_with_user_state
-- Returns a sheet + like/save state for the current user
-- ============================================================

CREATE OR REPLACE FUNCTION get_sheet_user_state(p_slug TEXT)
RETURNS TABLE (
  liked   BOOLEAN,
  saved   BOOLEAN,
  likes   INTEGER
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM user_likes ul
      JOIN coloring_pages cp ON cp.id = ul.coloring_page_id
      WHERE cp.slug = p_slug AND ul.user_id = auth.uid()
    )::BOOLEAN                                              AS liked,
    EXISTS (
      SELECT 1 FROM user_saves us
      JOIN coloring_pages cp ON cp.id = us.coloring_page_id
      WHERE cp.slug = p_slug AND us.user_id = auth.uid()
    )::BOOLEAN                                              AS saved,
    COALESCE((SELECT likes_count FROM coloring_pages WHERE slug = p_slug), 0) AS likes;
$$;

-- ============================================================
-- RPC: toggle_like / toggle_save  (atomic, idempotent)
-- ============================================================

CREATE OR REPLACE FUNCTION toggle_like(p_slug TEXT)
RETURNS TABLE (liked BOOLEAN, likes INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_page_id UUID;
  v_liked   BOOLEAN;
BEGIN
  SELECT id INTO v_page_id FROM coloring_pages WHERE slug = p_slug;
  IF v_page_id IS NULL THEN RAISE EXCEPTION 'Sheet not found'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_likes WHERE user_id = auth.uid() AND coloring_page_id = v_page_id
  ) INTO v_liked;

  IF v_liked THEN
    DELETE FROM user_likes WHERE user_id = auth.uid() AND coloring_page_id = v_page_id;
  ELSE
    INSERT INTO user_likes (user_id, coloring_page_id) VALUES (auth.uid(), v_page_id);
  END IF;

  RETURN QUERY
    SELECT (NOT v_liked),
           (SELECT likes_count FROM coloring_pages WHERE id = v_page_id);
END;
$$;

CREATE OR REPLACE FUNCTION toggle_save(p_slug TEXT)
RETURNS TABLE (saved BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_page_id UUID;
  v_saved   BOOLEAN;
BEGIN
  SELECT id INTO v_page_id FROM coloring_pages WHERE slug = p_slug;
  IF v_page_id IS NULL THEN RAISE EXCEPTION 'Sheet not found'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_saves WHERE user_id = auth.uid() AND coloring_page_id = v_page_id
  ) INTO v_saved;

  IF v_saved THEN
    DELETE FROM user_saves WHERE user_id = auth.uid() AND coloring_page_id = v_page_id;
  ELSE
    INSERT INTO user_saves (user_id, coloring_page_id) VALUES (auth.uid(), v_page_id);
  END IF;

  RETURN QUERY SELECT (NOT v_saved);
END;
$$;
