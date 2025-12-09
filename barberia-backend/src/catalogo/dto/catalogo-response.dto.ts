import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta de catálogo para el mall (Interface 4 - CATALOGO)
 * Formato esperado por el mall según especificación
 */
export class CatalogoResponseDto {
  @ApiProperty({ description: 'ID de la sucursal', example: 1 })
  store_id: number;

  @ApiProperty({ description: 'ID del servicio', example: 'SRV001' })
  id: string;

  @ApiProperty({ description: 'Nombre del servicio', example: 'Corte de cabello' })
  nombre: string;

  @ApiProperty({ description: 'Descripción del servicio', example: 'Corte de cabello clásico', required: false })
  description?: string;

  @ApiProperty({ description: 'Precio del servicio', example: 150.00 })
  precio: number;

  @ApiProperty({ description: 'Talla del servicio (si aplica)', example: null, required: false })
  talla?: string | null;

  @ApiProperty({ description: 'Color del servicio (si aplica)', example: null, required: false })
  color?: string | null;

  @ApiProperty({ description: 'Stock del servicio (si aplica)', example: null, required: false })
  stock?: number | null;

  @ApiProperty({ description: 'Duración en minutos', example: 30 })
  duracion_minutos: number;
}

