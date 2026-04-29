-- 1. Tabel Shift/Jadwal Kerja Reguler Terapis
CREATE TABLE IF NOT EXISTS public.therapist_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Minggu, 1 = Senin, dst.
    is_working BOOLEAN DEFAULT true,
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '21:00:00',
    break_start_time TIME, -- Boleh nill jika tidak ada istirahat tetap
    break_end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(therapist_id, day_of_week) -- 1 terapis hanya punya 1 record per hari dlm seminggu
);

-- 2. Tabel Libur/Pengecualian Fleksibel (Time Off)
CREATE TABLE IF NOT EXISTS public.therapist_timeoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
    off_date DATE NOT NULL,
    reason TEXT, -- cth: Libur Mingguan, Sakit
    is_full_day BOOLEAN DEFAULT true,
    start_time TIME, -- Dianggap jika is_full_day false
    end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(therapist_id, off_date) -- Hindari duplikat cuti di hari yg sama
);

-- Mengaktifkan RLS dan membuat policy agar bisa diakses public/anon sementara (karena asumsi project pakai key public)
ALTER TABLE public.therapist_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_timeoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow ALL on therapist_shifts" ON public.therapist_shifts FOR ALL USING (true);
CREATE POLICY "Allow ALL on therapist_timeoffs" ON public.therapist_timeoffs FOR ALL USING (true);
