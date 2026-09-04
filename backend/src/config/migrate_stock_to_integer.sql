-- Migración para una base existente: convierte el stock descriptivo en cantidad numérica.
-- Equivalencias iniciales de esta versión de prueba:
--   "En stock"       -> 10 unidades
--   "Pocas unidades" -> 3 unidades
-- Cambia estos valores antes de ejecutar el script si tu inventario real es diferente.

UPDATE componentes
SET stock = CASE LOWER(TRIM(stock))
  WHEN 'en stock' THEN '10'
  WHEN 'pocas unidades' THEN '3'
  WHEN 'sin stock' THEN '0'
  ELSE '0'
END;

ALTER TABLE componentes
  MODIFY COLUMN stock INT UNSIGNED NOT NULL DEFAULT 0;
