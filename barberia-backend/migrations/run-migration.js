const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'postbase',
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? {
      rejectUnauthorized: false,
    } : false,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Leer el script SQL
    const sqlPath = path.join(__dirname, 'migrate_precio_base_to_precio.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Ejecutando migración...');
    
    // Ejecutar el script
    await client.query(sql);
    
    console.log('✅ Migración ejecutada exitosamente');
    
    // Verificar resultado
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'barberia' 
      AND table_name = 'servicio'
      AND column_name IN ('precio', 'talla', 'color', 'stock', 'precio_base')
      ORDER BY column_name;
    `);
    
    console.log('\n📊 Columnas en tabla servicio:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

