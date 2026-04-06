
-- Add page_configs (hero content for each catalog page) and section_visibility (landing page sections)
ALTER TABLE public.system_settings
ADD COLUMN page_configs jsonb NOT NULL DEFAULT '{
  "estetica-avancada": {"photoUrl": null, "expertName": "Rayssa Leslie", "expertSubtitle": "Especialista em Estética Avançada", "pageTitle": "Estética Avançada Feminina", "pageDescription": ""},
  "nucleo-materno": {"photoUrl": null, "expertName": "Rayssa Leslie", "expertSubtitle": "Enfermeira Obstetra", "pageTitle": "Núcleo Materno", "pageDescription": ""},
  "produtos-programas": {"photoUrl": null, "expertName": "Perila Lobato", "expertSubtitle": "Designer de Produtos", "pageTitle": "Produtos & Programas Online", "pageDescription": ""},
  "parceria-rosangela": {"photoUrl": null, "expertName": "Rosângela", "expertSubtitle": "Especialista", "pageTitle": "Parceria Rosângela", "pageDescription": ""}
}'::jsonb,
ADD COLUMN section_visibility jsonb NOT NULL DEFAULT '{
  "services": true,
  "blog": true,
  "testimonials": true
}'::jsonb;
