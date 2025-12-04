-- Migración: Actualizar barberia.transaccionpago al nuevo contrato del banco
-- Ejecutar este script antes de correr la aplicación con la nueva versión

BEGIN;

-- Asegurar que existe la columna tipo (nuevo campo del banco)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'barberia'
          AND table_name = 'transaccionpago'
          AND column_name = 'tipo'
    ) THEN
        ALTER TABLE barberia.transaccionpago ADD COLUMN tipo varchar(50);
    END IF;

    -- Copiar temporalmente el valor previo (tipo_operacion) si ambas columnas existen
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'barberia'
          AND table_name = 'transaccionpago'
          AND column_name = 'tipo_operacion'
    ) THEN
        UPDATE barberia.transaccionpago
        SET tipo = tipo_operacion
        WHERE tipo IS NULL AND tipo_operacion IS NOT NULL;
    END IF;
END $$;

-- Agregar columna numero_tarjeta
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'barberia'
          AND table_name = 'transaccionpago'
          AND column_name = 'numero_tarjeta'
    ) THEN
        ALTER TABLE barberia.transaccionpago ADD COLUMN numero_tarjeta varchar(34);
    END IF;

    -- Reusar el valor enmascarado anterior como histórico si existe la columna vieja
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'barberia'
          AND table_name = 'transaccionpago'
          AND column_name = 'numero_tarjeta_mask'
    ) THEN
        UPDATE barberia.transaccionpago
        SET numero_tarjeta = numero_tarjeta_mask
        WHERE numero_tarjeta IS NULL AND numero_tarjeta_mask IS NOT NULL;
    END IF;
END $$;

-- Agregar columna estado_banco_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'barberia'
          AND table_name = 'transaccionpago'
          AND column_name = 'estado_banco_id'
    ) THEN
        ALTER TABLE barberia.transaccionpago ADD COLUMN estado_banco_id varchar(50);
    END IF;
END $$;

-- Agregar columna firma
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'barberia'
          AND table_name = 'transaccionpago'
          AND column_name = 'firma'
    ) THEN
        ALTER TABLE barberia.transaccionpago ADD COLUMN firma varchar(255);
    END IF;
END $$;

-- Agregar columna creada_utc
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'barberia'
          AND table_name = 'transaccionpago'
          AND column_name = 'creada_utc'
    ) THEN
        ALTER TABLE barberia.transaccionpago ADD COLUMN creada_utc timestamptz;
    END IF;
END $$;

-- Eliminar columnas obsoletas que ya no se envían al banco
DO $$
DECLARE 
    columnas_obsoletas TEXT[] := ARRAY[
        'tipo_operacion',
        'moneda',
        'medio_pago',
        'intentos',
        'numero_tarjeta_mask',
        'token_tarjeta',
        'nombre_tarjetahab',
        'mes_exp',
        'anio_exp',
        'cvv_hash',
        'cta_origen',
        'cta_destino',
        'autorizacion'
    ];
    columna TEXT;
BEGIN
    FOREACH columna IN ARRAY columnas_obsoletas
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'barberia'
              AND table_name = 'transaccionpago'
              AND column_name = columna
        ) THEN
            EXECUTE format('ALTER TABLE barberia.transaccionpago DROP COLUMN %I', columna);
        END IF;
    END LOOP;
END $$;

COMMIT;

-- Verificar columnas finales
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'barberia'
  AND table_name = 'transaccionpago'
  AND column_name IN (
      'tipo',
      'numero_tarjeta',
      'estado_banco_id',
      'firma',
      'creada_utc'
  )
ORDER BY column_name;

