-- Script para crear estados de venta iniciales
-- Ejecutar este script en PostgreSQL antes de crear ventas

-- Asegurarse de estar en el esquema correcto
SET search_path = barberia;

-- Crear estados de venta básicos
INSERT INTO barberia.catestadoventa (codigo, descripcion) 
VALUES 
  ('PENDIENTE', 'Pendiente de pago'),
  ('COMPLETADA', 'Venta completada'),
  ('CANCELADA', 'Venta cancelada'),
  ('PAGADA', 'Venta pagada')
ON CONFLICT (codigo) DO NOTHING;

-- Verificar que se crearon correctamente
SELECT estado_venta_id, codigo, descripcion 
FROM barberia.catestadoventa
ORDER BY estado_venta_id;

