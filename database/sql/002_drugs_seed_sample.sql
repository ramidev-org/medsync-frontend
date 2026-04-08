-- Minimal seed data (so the UI works immediately after creating the table)
insert into public.drugs (code, brand_name, form, dosage, active) values
  ('D0001', 'GRIPEX ALLERGIE', 'ComprimÃ©', '10MG', true),
  ('D0002', 'GRIPEX GLES', 'Microgranules', '50MG/4MG', true),
  ('D0003', 'GRIPEX PLUS', 'ComprimÃ©', '200MG/30MG', true),
  ('D0004', 'GRIPEX TOUX GRASSE', 'Solution buvable', '5%', true),
  ('D0005', 'AUGMENTIN', 'ComprimÃ©', '500MG/125MG', true),
  ('D0006', 'DOLIPRANE', 'ComprimÃ©', '1000MG', true),
  ('D0007', 'SPASFON', 'ComprimÃ©', '80MG', true)
on conflict do nothing;
