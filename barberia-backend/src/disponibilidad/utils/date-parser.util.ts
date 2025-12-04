/**
 * Utilidad para parsear fechas en formatos amigables
 * Acepta:
 * - "2024-12-23" -> 2024-12-23 00:00:00
 * - "2024-12-23 18:30" -> 2024-12-23 18:30:00
 * - "2024-12-23T18:30" -> 2024-12-23 18:30:00
 * - "2024-12-23T18:30:00Z" -> 2024-12-23 18:30:00 (UTC)
 */
export function parseFechaAmigable(fechaString: string): Date {
  if (!fechaString || fechaString.trim() === '') {
    throw new Error('La fecha no puede estar vacía');
  }

  const fechaTrimmed = fechaString.trim();

  // Formato 1: "2024-12-23" (solo fecha)
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaTrimmed)) {
    const [year, month, day] = fechaTrimmed.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  // Formato 2: "2024-12-23 18:30" o "2024-12-23 18:30:00" (fecha y hora con espacio)
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(fechaTrimmed)) {
    const [datePart, timePart] = fechaTrimmed.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds || 0, 0);
  }

  // Formato 3: "2024-12-23T18:30" o "2024-12-23T18:30:00" (ISO sin Z)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?$/.test(fechaTrimmed)) {
    const [datePart, timePart] = fechaTrimmed.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const timeClean = timePart.replace(/\.\d{3}$/, ''); // Remover milisegundos si existen
    const [hours, minutes, seconds = 0] = timeClean.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds || 0, 0);
  }

  // Formato 4: ISO completo con Z (mantener compatibilidad)
  try {
    const date = new Date(fechaTrimmed);
    if (isNaN(date.getTime())) {
      throw new Error(`Formato de fecha no reconocido: ${fechaString}`);
    }
    return date;
  } catch (error) {
    throw new Error(`Formato de fecha no reconocido: ${fechaString}. Use formatos: "2024-12-23", "2024-12-23 18:30", o "2024-12-23T18:30"`);
  }
}

