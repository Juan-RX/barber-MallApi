-- Migración: Cambiar precio_base a precio en tabla servicio
-- Ejecutar este script manualmente en PostgreSQL antes de iniciar el servidor

BEGIN;

-- Paso 1: Agregar columna precio como nullable (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'barberia' 
        AND table_name = 'servicio' 
        AND column_name = 'precio'
    ) THEN
        ALTER TABLE barberia.servicio ADD COLUMN precio numeric(10,2);
    END IF;
END $$;

-- Paso 2: Copiar valores de precio_base a precio (si precio_base existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'barberia' 
        AND table_name = 'servicio' 
        AND column_name = 'precio_base'
    ) THEN
        UPDATE barberia.servicio 
        SET precio = precio_base 
        WHERE precio IS NULL AND precio_base IS NOT NULL;
        
        -- Si hay servicios sin precio_base, asignar 0 como valor por defecto
        UPDATE barberia.servicio 
        SET precio = 0 
        WHERE precio IS NULL;
    ELSE
        -- Si no existe precio_base, asignar 0 a todos los servicios
        UPDATE barberia.servicio 
        SET precio = 0 
        WHERE precio IS NULL;
    END IF;
END $$;

-- Paso 3: Hacer precio NOT NULL
ALTER TABLE barberia.servicio ALTER COLUMN precio SET NOT NULL;

-- Paso 4: Eliminar columna precio_base (si existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'barberia' 
        AND table_name = 'servicio' 
        AND column_name = 'precio_base'
    ) THEN
        ALTER TABLE barberia.servicio DROP COLUMN precio_base;
    END IF;
END $$;

-- Paso 5: Agregar columnas nuevas (talla, color, stock) si no existen
DO $$
BEGIN
    -- Agregar talla
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'barberia' 
        AND table_name = 'servicio' 
        AND column_name = 'talla'
    ) THEN
        ALTER TABLE barberia.servicio ADD COLUMN talla varchar(20);
    END IF;
    
    -- Agregar color
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'barberia' 
        AND table_name = 'servicio' 
        AND column_name = 'color'
    ) THEN
        ALTER TABLE barberia.servicio ADD COLUMN color varchar(30);
    END IF;
    
    -- Agregar stock
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'barberia' 
        AND table_name = 'servicio' 
        AND column_name = 'stock'
    ) THEN
        ALTER TABLE barberia.servicio ADD COLUMN stock integer;
    END IF;
END $$;

COMMIT;

-- Verificar que la migración fue exitosa
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'barberia' 
AND table_name = 'servicio'
AND column_name IN ('precio', 'talla', 'color', 'stock', 'precio_base')
ORDER BY column_name;

