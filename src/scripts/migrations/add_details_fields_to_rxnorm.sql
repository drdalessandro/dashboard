-- Add new columns to rxnorm_medications table for tracking detail lookup status
ALTER TABLE public.rxnorm_medications 
ADD COLUMN IF NOT EXISTS details_checked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS error_fetching BOOLEAN DEFAULT FALSE;

-- Create index on details_checked for faster lookups
CREATE INDEX IF NOT EXISTS rxnorm_medications_details_checked_idx ON public.rxnorm_medications (details_checked);

-- Comment these columns
COMMENT ON COLUMN public.rxnorm_medications.details_checked IS 'Whether detailed information has been fetched';
COMMENT ON COLUMN public.rxnorm_medications.error_fetching IS 'Whether there was an error fetching detailed information';
