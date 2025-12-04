import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SlotDisponibleDto {
  @ApiProperty({
    description: 'Fecha y hora de inicio del slot',
    example: '2024-12-23 09:00',
  })
  @Transform(({ value }) => {
    if (value instanceof Date) {
      // Formatear a formato amigable: "YYYY-MM-DD HH:mm"
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const hours = String(value.getHours()).padStart(2, '0');
      const minutes = String(value.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    return value;
  })
  fechaInicio: Date | string;

  @ApiProperty({
    description: 'Fecha y hora de fin del slot',
    example: '2024-12-23 09:30',
  })
  @Transform(({ value }) => {
    if (value instanceof Date) {
      // Formatear a formato amigable: "YYYY-MM-DD HH:mm"
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const hours = String(value.getHours()).padStart(2, '0');
      const minutes = String(value.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    return value;
  })
  fechaFin: Date | string;

  @ApiProperty({ description: 'ID del barbero disponible', example: 1, required: false })
  barberoId?: number;

  @ApiProperty({ description: 'Nombre del barbero', example: 'Juan Pérez', required: false })
  barberoNombre?: string;

  @ApiProperty({ description: 'Indica si el slot está disponible', example: true })
  disponible: boolean;
}

