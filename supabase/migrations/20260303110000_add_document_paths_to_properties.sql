ALTER TABLE properties
ADD COLUMN IF NOT EXISTS document_paths text[];
