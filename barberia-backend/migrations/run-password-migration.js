const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runPasswordMigration() {
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

    const sqlPath = path.join(__dirname, 'agregar_password_cliente.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Ejecutando migración para agregar campo password a cliente...');
    await client.query(sql);
    console.log('✅ Migración ejecutada exitosamente');

    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'barberia' 
        AND table_name = 'cliente'
        AND column_name = 'password';
    `);

    if (result.rows.length > 0) {
      console.log('\n📊 Columna password en tabla cliente:');
      console.table(result.rows);
    } else {
      console.log('\n⚠️  La columna password no se encontró en la tabla cliente');
    }
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runPasswordMigration();


