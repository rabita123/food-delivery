-- Remove duplicate categories
WITH duplicates AS (
  SELECT name,
         MIN(id) as id_to_keep
  FROM categories
  GROUP BY name
  HAVING COUNT(*) > 1
)
DELETE FROM categories c
USING duplicates d
WHERE c.name = d.name
AND c.id != d.id_to_keep;

-- Add unique constraint on category name
ALTER TABLE categories
ADD CONSTRAINT categories_name_unique UNIQUE (name); 