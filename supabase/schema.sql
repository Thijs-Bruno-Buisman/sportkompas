-- ============================================================================
-- SPORTKOMPAS - SUPABASE DATABASE SCHEMA MET ROW LEVEL SECURITY (RLS)
-- Voer dit script uit in de Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- 1. PROFIELEN (Koppelt aan auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    birth_date DATE,
    gender TEXT CHECK (gender IN ('man', 'vrouw', 'anders', 'onbekend')) DEFAULT 'onbekend',
    height_meters NUMERIC,
    start_weight_kg NUMERIC,
    target_weight_kg NUMERIC,
    activity_level TEXT CHECK (activity_level IN ('sedentair', 'licht', 'gemiddeld', 'zeer', 'onbekend')) DEFAULT 'gemiddeld',
    primary_goal TEXT CHECK (primary_goal IN ('kracht', 'spieropbouw', 'conditie', 'afvallen', 'fit_blijven', 'onbekend')) DEFAULT 'kracht',
    experience_level TEXT CHECK (experience_level IN ('beginner', 'gemiddeld', 'gevorderd', 'onbekend')) DEFAULT 'gemiddeld',
    strength_days_per_week INT DEFAULT 3,
    cardio_days_per_week INT DEFAULT 2,
    available_equipment TEXT[] DEFAULT ARRAY['barbell', 'dumbbell', 'kabel', 'machine', 'lichaamsgewicht'],
    unit_preference TEXT CHECK (unit_preference IN ('metric', 'imperial')) DEFAULT 'metric',
    formula_preference TEXT CHECK (formula_preference IN ('mifflin_st_jeor', 'katch_mcardle', 'onbekend')) DEFAULT 'mifflin_st_jeor',
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. GEBRUIKERSINSTELLINGEN (App Settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme TEXT CHECK (theme IN ('dark', 'light', 'system')) DEFAULT 'dark',
    unit_preference TEXT CHECK (unit_preference IN ('metric', 'imperial')) DEFAULT 'metric',
    rest_timer_seconds INT DEFAULT 90,
    sound_enabled BOOLEAN DEFAULT true,
    haptic_feedback_enabled BOOLEAN DEFAULT true,
    week_starts_on TEXT DEFAULT 'maandag',
    weekly_workout_goal INT DEFAULT 3,
    favorite_exercise_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    nutrition_target_calories INT DEFAULT 2500,
    nutrition_target_protein_grams NUMERIC DEFAULT 160,
    nutrition_target_carbs_grams NUMERIC DEFAULT 280,
    nutrition_target_fat_grams NUMERIC DEFAULT 70,
    nutrition_target_water_ml INT DEFAULT 2500,
    strava_connected BOOLEAN DEFAULT false,
    strava_athlete_id BIGINT,
    strava_athlete_name TEXT,
    strava_last_sync_at TIMESTAMPTZ,
    last_backup_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. OEFENINGEN (Eigen/Aangepaste oefeningen van de gebruiker)
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    alternative_names TEXT[] DEFAULT ARRAY[]::TEXT[],
    category TEXT NOT NULL DEFAULT 'kracht',
    primary_muscle_group TEXT NOT NULL,
    secondary_muscle_groups TEXT[] DEFAULT ARRAY[]::TEXT[],
    equipment TEXT NOT NULL DEFAULT 'barbell',
    measurement_type TEXT NOT NULL DEFAULT 'gewicht_herhalingen',
    is_custom BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    instructions TEXT DEFAULT '',
    technique_notes TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WORKOUT ROUTINES (Trainingsschema's)
CREATE TABLE IF NOT EXISTS public.workout_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ROUTINE DAGEN (Dagen binnen een schema)
CREATE TABLE IF NOT EXISTS public.routine_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    routine_id UUID NOT NULL REFERENCES public.workout_routines(id) ON DELETE CASCADE,
    day_index INT NOT NULL,
    name TEXT NOT NULL,
    planned_exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. GEPLANDE SESSIES (Kalender planning)
CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_date DATE NOT NULL,
    routine_id UUID REFERENCES public.workout_routines(id) ON DELETE SET NULL,
    routine_day_id UUID REFERENCES public.routine_days(id) ON DELETE SET NULL,
    routine_version INT DEFAULT 1,
    status TEXT CHECK (status IN ('gepland', 'afgerond', 'geannuleerd', 'overgeslagen')) DEFAULT 'gepland',
    completed_session_id UUID,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. WORKOUT SESSIES (Uitgevoerde trainingen)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status TEXT CHECK (status IN ('actief', 'afgerond', 'geannuleerd')) DEFAULT 'afgerond',
    current_exercise_index INT DEFAULT 0,
    routine_id UUID REFERENCES public.workout_routines(id) ON DELETE SET NULL,
    routine_day_id UUID REFERENCES public.routine_days(id) ON DELETE SET NULL,
    duration_minutes INT,
    snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    overall_rpe NUMERIC,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. WORKOUT SETS (Individuele sets)
CREATE TABLE IF NOT EXISTS public.workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL,
    set_number INT NOT NULL,
    set_type TEXT CHECK (set_type IN ('warmup', 'normal', 'drop', 'failure')) DEFAULT 'normal',
    weight_kg NUMERIC NOT NULL DEFAULT 0,
    reps INT NOT NULL DEFAULT 0,
    duration_seconds INT,
    target_rpe NUMERIC,
    actual_rpe NUMERIC,
    rest_time_seconds INT DEFAULT 90,
    completed BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CARDIO SESSIES
CREATE TABLE IF NOT EXISTS public.cardio_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    activity_type TEXT NOT NULL DEFAULT 'hardlopen',
    distance_meters NUMERIC NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 0,
    avg_heart_rate_bpm INT,
    max_heart_rate_bpm INT,
    estimated_calories_burned NUMERIC,
    elevation_gain_meters NUMERIC,
    cadence_rpm INT,
    rpe NUMERIC,
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'afgerond',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. EIGEN VOEDINGSMIDDELEN (Custom Food Items)
CREATE TABLE IF NOT EXISTS public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT DEFAULT 'overig',
    barcode TEXT,
    calories_per_100g NUMERIC NOT NULL DEFAULT 0,
    protein_grams_per_100g NUMERIC NOT NULL DEFAULT 0,
    carbs_grams_per_100g NUMERIC NOT NULL DEFAULT 0,
    fat_grams_per_100g NUMERIC NOT NULL DEFAULT 0,
    fiber_grams_per_100g NUMERIC NOT NULL DEFAULT 0,
    default_portion_grams NUMERIC NOT NULL DEFAULT 100,
    is_custom BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. RECEPTEN (Recipes)
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    portions INT NOT NULL DEFAULT 1,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_grams NUMERIC NOT NULL DEFAULT 0,
    total_calories NUMERIC NOT NULL DEFAULT 0,
    total_protein_grams NUMERIC NOT NULL DEFAULT 0,
    total_carbs_grams NUMERIC NOT NULL DEFAULT 0,
    total_fat_grams NUMERIC NOT NULL DEFAULT 0,
    total_fiber_grams NUMERIC NOT NULL DEFAULT 0,
    calories_per_portion NUMERIC NOT NULL DEFAULT 0,
    protein_per_portion NUMERIC NOT NULL DEFAULT 0,
    carbs_per_portion NUMERIC NOT NULL DEFAULT 0,
    fat_per_portion NUMERIC NOT NULL DEFAULT 0,
    fiber_per_portion NUMERIC NOT NULL DEFAULT 0,
    is_custom BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. MAALTIJDDAGBOEK (Meal Logs)
CREATE TABLE IF NOT EXISTS public.meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_date DATE NOT NULL,
    meal_type TEXT CHECK (meal_type IN ('ontbijt', 'lunch', 'diner', 'snacks')) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_calories NUMERIC NOT NULL DEFAULT 0,
    total_protein_grams NUMERIC NOT NULL DEFAULT 0,
    total_carbs_grams NUMERIC NOT NULL DEFAULT 0,
    total_fat_grams NUMERIC NOT NULL DEFAULT 0,
    total_fiber_grams NUMERIC NOT NULL DEFAULT 0,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. GEPLANDE MAALTIJDEN (Planned Meals)
CREATE TABLE IF NOT EXISTS public.planned_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_date DATE NOT NULL,
    meal_type TEXT CHECK (meal_type IN ('ontbijt', 'lunch', 'diner', 'snacks')) NOT NULL,
    name TEXT NOT NULL,
    recipe_id UUID,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_calories NUMERIC NOT NULL DEFAULT 0,
    total_protein_grams NUMERIC NOT NULL DEFAULT 0,
    total_carbs_grams NUMERIC NOT NULL DEFAULT 0,
    total_fat_grams NUMERIC NOT NULL DEFAULT 0,
    total_fiber_grams NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'gepland',
    notes TEXT DEFAULT '',
    consumed_meal_log_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. WATER REGISTRATIE
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_date DATE NOT NULL,
    amount_ml INT NOT NULL DEFAULT 250,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. LICHAAMSMETINGEN
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_date DATE NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    weight_kg NUMERIC NOT NULL,
    body_fat_percentage NUMERIC,
    chest_meters NUMERIC,
    waist_meters NUMERIC,
    hips_meters NUMERIC,
    arms_meters NUMERIC,
    thighs_meters NUMERIC,
    notes TEXT DEFAULT ''
);

-- 16. HERSTEL EN SLAAP (Recovery Logs)
CREATE TABLE IF NOT EXISTS public.recovery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_date DATE NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sleep_duration_minutes INT,
    sleep_quality_rating INT,
    resting_heart_rate_bpm INT,
    soreness_rating INT,
    stress_rating INT,
    notes TEXT DEFAULT ''
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) ACTIVEREN OP ALLE TABELLEN
-- Zorgt ervoor dat elke ingelogde gebruiker UITSLUITEND eigen data kan zien/bewerken.
-- ============================================================================

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'profiles', 'app_settings', 'exercises', 'workout_routines', 'routine_days',
        'scheduled_sessions', 'workout_sessions', 'workout_sets', 'cardio_sessions',
        'food_items', 'recipes', 'meal_logs', 'planned_meals', 'water_logs',
        'body_measurements', 'recovery_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        
        -- Speciaal geval voor profiles: id is user_id
        IF tbl = 'profiles' THEN
            EXECUTE format('DROP POLICY IF EXISTS "Users can view own profile" ON public.%I;', tbl);
            EXECUTE format('CREATE POLICY "Users can view own profile" ON public.%I FOR SELECT USING (auth.uid() = id);', tbl);
            
            EXECUTE format('DROP POLICY IF EXISTS "Users can insert own profile" ON public.%I;', tbl);
            EXECUTE format('CREATE POLICY "Users can insert own profile" ON public.%I FOR INSERT WITH CHECK (auth.uid() = id);', tbl);
            
            EXECUTE format('DROP POLICY IF EXISTS "Users can update own profile" ON public.%I;', tbl);
            EXECUTE format('CREATE POLICY "Users can update own profile" ON public.%I FOR UPDATE USING (auth.uid() = id);', tbl);
        ELSE
            EXECUTE format('DROP POLICY IF EXISTS "Users can manage own data" ON public.%I;', tbl);
            EXECUTE format('CREATE POLICY "Users can manage own data" ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);', tbl);
        END IF;
    END LOOP;
END $$;

