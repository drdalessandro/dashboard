CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create offline_queue table for storing offline operations
CREATE TABLE IF NOT EXISTS public.offline_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(64) NOT NULL,
    data JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create RxNorm medications table for local caching
CREATE TABLE IF NOT EXISTS public.rxnorm_medications (
    rxcui VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    tty VARCHAR NOT NULL, -- Term Type in RxNorm
    active_ingredients JSONB,
    dosage_form VARCHAR,
    strength VARCHAR,
    route VARCHAR,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for faster searching
CREATE INDEX IF NOT EXISTS rxnorm_medications_name_idx ON public.rxnorm_medications USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS rxnorm_medications_dosage_form_idx ON public.rxnorm_medications (dosage_form);

-- Enable Row Level Security for these tables
ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rxnorm_medications ENABLE ROW LEVEL SECURITY;

-- Create policies to allow authenticated users to access their own data
CREATE POLICY "Allow authenticated users to view RxNorm data"
    ON public.rxnorm_medications
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert RxNorm data"
    ON public.rxnorm_medications
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update RxNorm data"
    ON public.rxnorm_medications
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access their own offline queue"
    ON public.offline_queue
    FOR ALL
    USING (auth.uid() = auth.uid());