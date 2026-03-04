ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS college_period text;

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS owner_cpf_cnpj text,
ADD COLUMN IF NOT EXISTS owner_email text;
