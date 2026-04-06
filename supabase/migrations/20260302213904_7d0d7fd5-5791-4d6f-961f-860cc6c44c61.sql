
ALTER TABLE public.system_settings
ADD COLUMN hero_photo_url text DEFAULT NULL,
ADD COLUMN hero_card_name text NOT NULL DEFAULT 'Rayssa Leslie',
ADD COLUMN hero_card_subtitle text NOT NULL DEFAULT 'Esteticista & Enfermeira Obstetra';
