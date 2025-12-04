const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runTransaccionMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'postbase',
    ssl:
      process.env.DB_HOST && process.env.DB_HOST !== 'localhost'
        ? {
            rejectUnauthorized: false,
          }
        : false,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    const sqlPath = path.join(__dirname, 'actualizar_transaccionpago_contrato_banco.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Ejecutando migración de transacciones...');
    await client.query(sql);
    console.log('✅ Migración ejecutada exitosamente');

    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'barberia' 
        AND table_name = 'transaccionpago'
        AND column_name IN ('tipo','numero_tarjeta','estado_banco_id','firma','creada_utc')
      ORDER BY column_name;
    `);

    console.log('\n📊 Columnas en tabla transaccionpago:');
    console.table(result.rows);
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTransaccionMigration();

