# API Barbería

API REST desarrollada con NestJS para la gestión de una barbería, incluyendo catálogos, disponibilidad de citas, transacciones y ventas de servicios.

## 🚀 Características

- **Catálogo**: Gestión de sucursales, servicios, productos y barberos
- **Disponibilidad**: Consulta de disponibilidad de citas por servicio, barbero y fecha
- **Transacciones**: Gestión de transacciones de pago
- **Ventas**: Creación y gestión de ventas de servicios y productos
- **Swagger**: Documentación interactiva de la API

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio (o navegar al directorio del proyecto)

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar el archivo `.env` con tus credenciales de PostgreSQL.

4. Ejecutar el script SQL para crear la base de datos:
```bash
psql -U postgres -d postgres -f c:\Users\jport\Downloads\postbase.sql
```

O ejecutar el script SQL directamente en tu cliente de PostgreSQL.

## 🏃 Ejecución

### Modo desarrollo:
```bash
npm run start:dev
```

### Modo producción:
```bash
npm run build
npm run start:prod
```

La aplicación estará disponible en `http://localhost:3000`

## 📚 Documentación Swagger

Una vez que la aplicación esté corriendo, accede a la documentación interactiva de Swagger en:

```
http://localhost:3000/api/docs
```

## 🗂️ Estructura del Proyecto

```
src/
├── entities/          # Entidades de TypeORM (mapeo de tablas)
├── catalogo/          # Módulo de catálogos
│   ├── dto/          # Data Transfer Objects
│   ├── catalogo.controller.ts
│   ├── catalogo.service.ts
│   └── catalogo.module.ts
├── disponibilidad/    # Módulo de disponibilidad de citas
├── transacciones/     # Módulo de transacciones de pago
├── ventas/           # Módulo de ventas de servicios
├── app.module.ts     # Módulo principal
└── main.ts           # Punto de entrada de la aplicación
```

## 📡 Endpoints Principales

### Catálogo
- `GET /catalogo/sucursales` - Listar sucursales
- `POST /catalogo/sucursales` - Crear sucursal
- `GET /catalogo/servicios` - Listar servicios
- `POST /catalogo/servicios` - Crear servicio
- `GET /catalogo/productos` - Listar productos
- `POST /catalogo/productos` - Crear producto
- `GET /catalogo/barberos` - Listar barberos
- `POST /catalogo/barberos` - Crear barbero

### Disponibilidad
- `POST /disponibilidad/check` - Verificar disponibilidad de citas
- `GET /disponibilidad/barbero/:barberoId` - Disponibilidad de un barbero

### Transacciones
- `GET /transacciones` - Listar transacciones
- `POST /transacciones` - Crear transacción
- `GET /transacciones/:id` - Obtener transacción por ID
- `GET /transacciones/venta/:ventaId` - Transacciones de una venta

### Ventas
- `GET /ventas` - Listar ventas
- `POST /ventas` - Crear venta
- `GET /ventas/:id` - Obtener venta por ID
- `GET /ventas/codigo/:orderCode` - Obtener venta por código

## 🛠️ Tecnologías Utilizadas

- **NestJS**: Framework de Node.js
- **TypeORM**: ORM para PostgreSQL
- **PostgreSQL**: Base de datos
- **Swagger/OpenAPI**: Documentación de API
- **class-validator**: Validación de DTOs
- **TypeScript**: Lenguaje de programación

## 📝 Notas

- La aplicación usa el esquema `barberia` en PostgreSQL
- En modo desarrollo, TypeORM sincroniza automáticamente las entidades
- En producción, se recomienda desactivar `synchronize` y usar migraciones
- Todas las rutas están documentadas en Swagger

## 🔒 Seguridad

- Asegúrate de no exponer las credenciales de la base de datos
- En producción, usa variables de entorno seguras
- Considera implementar autenticación y autorización según tus necesidades

## 📄 Licencia

Este proyecto es privado.

