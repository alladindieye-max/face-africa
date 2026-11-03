-- Authenticated clients must never be able to TRUNCATE application tables.
-- RLS does not protect against TRUNCATE, and clients do not need schema-level
-- trigger or foreign-key management privileges through the Data API.
REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.model_profiles FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.model_photos FROM authenticated;
