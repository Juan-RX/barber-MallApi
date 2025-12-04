import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración global de validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de CORS
  app.enableCors();

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API Barbería')
    .setDescription(
      'API REST para gestión de barbería. Incluye catálogos, disponibilidad de citas, transacciones y ventas. ' +
      'Los endpoints están organizados en dos categorías: Internos (uso de la barbería) y Mall (integración con el centro comercial).',
    )
    .setVersion('1.0')
    .setContact('Barbería API', '', '')
    // Endpoints Internos
    .addTag('Internos - Catálogo - Sucursales', 'Gestión de sucursales y sus horarios')
    .addTag('Internos - Catálogo - Servicios', 'Gestión de servicios')
    .addTag('Internos - Catálogo - Barberos', 'Gestión de barberos, sus horarios y pausas')
    .addTag('Internos - Catálogo - Excepciones', 'Gestión de excepciones de horario (vacaciones, cierres, horarios especiales)')
    .addTag('Internos - Disponibilidad', 'Consulta de disponibilidad de citas para uso interno')
    .addTag('Internos - Ventas', 'Gestión de ventas usando IDs internos')
    .addTag('Internos - Transacciones', 'Gestión de transacciones de pago (Interface 1-2)')
    .addTag('Internos - Clientes', 'Gestión de clientes')
    .addTag('Internos - Citas', 'Gestión de citas')
    // Endpoints Mall (Externos)
    .addTag('Mall - Catálogo', 'Endpoints de catálogo para integración con el mall (Interface 3-4)')
    .addTag('Mall - Disponibilidad', 'Consulta de disponibilidad para el mall (Interface 9-10)')
    .addTag('Mall - Ventas', 'Registro de ventas desde el mall (Interface 11 - REG_VTA_SERV)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'API Barbería - Documentación',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicación corriendo en: http://localhost:${port}`);
  console.log(`Documentación Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();

