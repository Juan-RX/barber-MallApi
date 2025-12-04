# Guía: Frontend React + Vite para API de Barbería

## Paso 1: Crear el proyecto React + Vite

```bash
# Crear proyecto con Vite
npm create vite@latest barberia-frontend -- --template react-ts

# O si prefieres JavaScript puro:
npm create vite@latest barberia-frontend -- --template react

# Navegar al directorio
cd barberia-frontend

# Instalar dependencias
npm install
```

## Paso 2: Instalar dependencias necesarias

```bash
# Cliente HTTP para llamadas a la API
npm install axios

# Routing para navegación
npm install react-router-dom

# Para manejar formularios
npm install react-hook-form

# Validación de formularios
npm install yup @hookform/resolvers

# Manejo de estado global (opcional)
npm install zustand

# UI Components (opcional - puedes usar otra librería)
npm install @mui/material @emotion/react @emotion/styled
# O
npm install antd
# O simplemente CSS/Tailwind
```

## Paso 3: Estructura de carpetas recomendada

```
barberia-frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── common/          # Componentes comunes (Button, Input, etc)
│   │   └── layout/          # Componentes de layout (Header, Footer, etc)
│   ├── pages/               # Páginas/Views
│   │   ├── Ventas/
│   │   │   ├── RegistroVenta.tsx
│   │   │   └── ListaVentas.tsx
│   │   └── Home.tsx
│   ├── services/            # Servicios API
│   │   ├── api.ts           # Cliente axios configurado
│   │   ├── ventas.service.ts
│   │   └── clientes.service.ts
│   ├── types/               # TypeScript types/interfaces
│   │   └── ventas.types.ts
│   ├── utils/               # Utilidades
│   │   └── constants.ts
│   ├── hooks/               # Custom hooks
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
└── vite.config.ts
```

## Paso 4: Configurar el cliente API

### `src/services/api.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Aquí puedes agregar tokens de autenticación si los tienes
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejo de errores global
    if (error.response) {
      console.error('Error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
```

### `src/services/ventas.service.ts`

```typescript
import api from './api';

export interface RegistroVentaServicioDto {
  id?: number;
  user_id: string;
  store_id: number;
  service_external_id: string;
  service_name: string;
  service_description?: string;
  duration_minutes: number;
  service_price: number;
  apointment_date?: string;
  apointment_time?: string;
  payment_status?: string;
  payment_method?: string;
  quantity?: number;
  discount_amount?: number;
  origen?: string;
  comentarios?: string;
}

export interface RegistroVentaResponse {
  id: number;
  user_id: string;
  store_id: number;
  service_external_id: string;
  service_name?: string;
  service_description?: string;
  service_price: number;
  apointment_date?: string;
  apointment_time?: string;
  duration_minutes: number;
  payment_status: string;
  payment_method?: string | null;
  confirmation_code: string;
  created_at: string;
  confirmation_code_created_at?: string;
}

export const ventasService = {
  registrarVentaServicio: async (
    data: RegistroVentaServicioDto
  ): Promise<RegistroVentaResponse> => {
    const response = await api.post<RegistroVentaResponse>(
      '/ventas/registro-servicio',
      data
    );
    return response.data;
  },
};
```

## Paso 5: Crear variables de entorno

### `.env`

```
VITE_API_URL=https://barber-mall-api.onrender.com
```

### `.env.local` (para desarrollo local)

```
VITE_API_URL=http://localhost:3000
```

## Paso 6: Configurar React Router

### `src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RegistroVenta from './pages/Ventas/RegistroVenta';
import ListaVentas from './pages/Ventas/ListaVentas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ventas/registro" element={<RegistroVenta />} />
        <Route path="/ventas" element={<ListaVentas />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Paso 7: Crear componente de registro de venta

### `src/pages/Ventas/RegistroVenta.tsx`

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ventasService, RegistroVentaServicioDto } from '../../services/ventas.service';

const RegistroVenta = () => {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RegistroVentaServicioDto>({
    defaultValues: {
      quantity: 1,
      discount_amount: 0,
      origen: 'MALL',
    },
  });

  const onSubmit = async (data: RegistroVentaServicioDto) => {
    setLoading(true);
    setMensaje(null);

    try {
      const respuesta = await ventasService.registrarVentaServicio(data);
      setMensaje({
        tipo: 'success',
        texto: `Venta registrada exitosamente! Código de confirmación: ${respuesta.confirmation_code}`,
      });
      reset(); // Limpiar formulario
    } catch (error: any) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al registrar la venta',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Registrar Venta de Servicio</h1>

      {mensaje && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: mensaje.tipo === 'success' ? '#d4edda' : '#f8d7da',
            color: mensaje.tipo === 'success' ? '#155724' : '#721c24',
            borderRadius: '4px',
          }}
        >
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Cliente */}
        <div>
          <label>ID Cliente (Código Externo) *</label>
          <input
            {...register('user_id', { required: 'Este campo es obligatorio' })}
            placeholder="CLI-EXT-001"
          />
          {errors.user_id && <span style={{ color: 'red' }}>{errors.user_id.message}</span>}
        </div>

        {/* Sucursal */}
        <div>
          <label>Sucursal ID *</label>
          <input
            type="number"
            {...register('store_id', { required: 'Este campo es obligatorio', valueAsNumber: true })}
            placeholder="3"
          />
          {errors.store_id && <span style={{ color: 'red' }}>{errors.store_id.message}</span>}
        </div>

        {/* Servicio */}
        <div>
          <label>Código Externo del Servicio *</label>
          <input
            {...register('service_external_id', { required: 'Este campo es obligatorio' })}
            placeholder="SRV003"
          />
          {errors.service_external_id && <span style={{ color: 'red' }}>{errors.service_external_id.message}</span>}
        </div>

        <div>
          <label>Nombre del Servicio *</label>
          <input
            {...register('service_name', { required: 'Este campo es obligatorio' })}
            placeholder="Masaje relajante"
          />
          {errors.service_name && <span style={{ color: 'red' }}>{errors.service_name.message}</span>}
        </div>

        <div>
          <label>Descripción del Servicio</label>
          <input
            {...register('service_description')}
            placeholder="Masaje anti-estrés"
          />
        </div>

        <div>
          <label>Duración (minutos) *</label>
          <input
            type="number"
            {...register('duration_minutes', { required: 'Este campo es obligatorio', valueAsNumber: true, min: 1 })}
            placeholder="80"
          />
          {errors.duration_minutes && <span style={{ color: 'red' }}>{errors.duration_minutes.message}</span>}
        </div>

        <div>
          <label>Precio *</label>
          <input
            type="number"
            step="0.01"
            {...register('service_price', { required: 'Este campo es obligatorio', valueAsNumber: true, min: 0 })}
            placeholder="150"
          />
          {errors.service_price && <span style={{ color: 'red' }}>{errors.service_price.message}</span>}
        </div>

        {/* Fecha y hora */}
        <div>
          <label>Fecha de la Cita</label>
          <input
            type="date"
            {...register('apointment_date')}
          />
        </div>

        <div>
          <label>Hora de la Cita</label>
          <input
            type="datetime-local"
            {...register('apointment_time')}
          />
        </div>

        {/* Estado de pago */}
        <div>
          <label>Estado de Pago</label>
          <select {...register('payment_status')}>
            <option value="">Seleccionar...</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADA">Pagada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        <div>
          <label>Método de Pago</label>
          <select {...register('payment_method')}>
            <option value="">Seleccionar...</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="EFECTIVO">Efectivo</option>
          </select>
        </div>

        <div>
          <label>Cantidad</label>
          <input
            type="number"
            {...register('quantity', { valueAsNumber: true, min: 1 })}
            defaultValue={1}
          />
        </div>

        <div>
          <label>Descuento</label>
          <input
            type="number"
            step="0.01"
            {...register('discount_amount', { valueAsNumber: true, min: 0 })}
            defaultValue={0}
          />
        </div>

        <div>
          <label>Comentarios</label>
          <textarea
            {...register('comentarios')}
            placeholder="Cliente regular"
            rows={3}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Venta'}
        </button>
      </form>
    </div>
  );
};

export default RegistroVenta;
```

## Paso 8: Crear página Home simple

### `src/pages/Home.tsx`

```tsx
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>API de Barbería - Frontend</h1>
      <nav style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/ventas/registro">Registrar Venta</Link>
        <Link to="/ventas">Listar Ventas</Link>
      </nav>
    </div>
  );
};

export default Home;
```

## Paso 9: Scripts para desarrollo

En `package.json`, ya deberías tener:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## Paso 10: Ejecutar el proyecto

```bash
# Modo desarrollo
npm run dev

# El proyecto estará en http://localhost:5173 (puerto por defecto de Vite)
```

## Próximos pasos recomendados

1. Agregar manejo de errores más robusto
2. Implementar loading states
3. Agregar validación de formularios más avanzada
4. Crear componentes de UI reutilizables
5. Agregar autenticación si es necesaria
6. Implementar lista de ventas
7. Agregar filtros y búsqueda
8. Mejorar el diseño con CSS/Tailwind/Material-UI

