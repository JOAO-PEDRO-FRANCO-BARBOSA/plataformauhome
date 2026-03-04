ALTER TABLE properties
ADD COLUMN IF NOT EXISTS rejection_reason text;
