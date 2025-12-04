import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CatalogoModule } from './catalogo/catalogo.module';
import { DisponibilidadModule } from './disponibilidad/disponibilidad.module';
import { TransaccionesModule } from './transacciones/transacciones.module';
import { VentasModule } from './ventas/ventas.module';
import { ClientesModule } from './clientes/clientes.module';
import { CitasModule } from './citas/citas.module';
import { ComprobantesModule } from './comprobantes/comprobantes.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'postbase',
      schema: 'barberia',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? {
        rejectUnauthorized: false,
      } : false,
    }),
    CatalogoModule,
    DisponibilidadModule,
    TransaccionesModule,
    VentasModule,
    ClientesModule,
    CitasModule,
    ComprobantesModule,
    AuthModule,
  ],
})
export class AppModule {}

