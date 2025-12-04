import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { disponibilidadService, type SlotDisponible } from '../services/disponibilidad.service';
import { serviciosService, type Servicio } from '../services/servicios.service';
import { barberosService, type Barbero } from '../services/barberos.service';
import { citasService } from '../services/citas.service';
import { citasApi } from '../services/cancelar.service';
import { clientesService, type Cliente } from '../services/clientes.service';
import { ventasService, type VentaResponse } from '../services/ventas.service';
import { transaccionesService } from '../services/transacciones.service';
import { comprobantesService, type Comprobante } from '../services/comprobantes.service';
import './AgendarCita.css';

type Paso = 1 | 2 | 3 | 4 | 5 | 6;

const DIAS_RANGO_INICIAL = 7;
const DIAS_RANGO_INCREMENTO = 7;

interface ClienteSeleccionado {
  clienteId?: number;
  nombre: string;
  email?: string;
  telefono?: string;
}

interface DiaConDisponibilidad {
  fecha: Date;
  tieneDisponibilidad: boolean;
}

const AgendarCita = () => {
  const navigate = useNavigate();
  const [paso, setPaso] = useState<Paso>(1);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  
  const sucursalId = 3; // ID de la sucursal por defecto
  const estadoVentaPendienteId =
    Number(import.meta.env.VITE_ESTADO_VENTA_PENDIENTE_ID || '') || 1;
  
  // Paso 0: Cliente
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
  });
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteSeleccionado | null>(null);
  
  // Paso 1: Servicios
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  const [rangoDiasDisponibles, setRangoDiasDisponibles] = useState(DIAS_RANGO_INICIAL);
  
  // Paso 2: Calendario
  const [diasDisponibles, setDiasDisponibles] = useState<DiaConDisponibilidad[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  
  // Paso 3: Barberos y horarios
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [barberoFiltro, setBarberoFiltro] = useState<number | null>(null);
  const [slotsDelDia, setSlotsDelDia] = useState<SlotDisponible[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponible | null>(null);
  
  // Paso 4: Confirmación
  // Paso 5 y 6: Venta y pago
  const [ventaCreada, setVentaCreada] = useState<VentaResponse | null>(null);
  const [citaReservadaId, setCitaReservadaId] = useState<number | null>(null);
  const [comprobanteGenerado, setComprobanteGenerado] = useState<Comprobante | null>(null);
  const [pagoForm, setPagoForm] = useState({
    numeroTarjeta: '',
    nombreTitular: '',
    mesExp: '',
    anioExp: '',
    cvv: '',
  });
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);

  useEffect(() => {
    cargarServicios();
  }, []);

  useEffect(() => {
    if (servicioSeleccionado) {
      cargarDiasDisponibles(rangoDiasDisponibles);
    }
  }, [servicioSeleccionado, rangoDiasDisponibles]);

  useEffect(() => {
    if (diaSeleccionado && servicioSeleccionado) {
      cargarBarberos();
      cargarHorariosDelDia();
    }
  }, [diaSeleccionado, servicioSeleccionado]);

  useEffect(() => {
    if (barberoFiltro !== null && diaSeleccionado && servicioSeleccionado) {
      cargarHorariosDelDia();
    }
  }, [barberoFiltro]);

  const handleClienteInputChange = (field: 'nombre' | 'email' | 'telefono', value: string) => {
    setClienteForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIdentificarCliente = async () => {
    const nombre = clienteForm.nombre.trim();
    const email = clienteForm.email.trim();
    const telefono = clienteForm.telefono.trim();

    if (!nombre || !email) {
      setMensaje({
        tipo: 'error',
        texto: 'Ingresa al menos nombre y correo para continuar',
      });
      return;
    }

    setLoading(true);
    setMensaje(null);

    try {
      const existentes = await clientesService.buscar({ email });
      let cliente: Cliente;

      if (existentes.length > 0) {
        cliente = existentes[0];
        setMensaje({ tipo: 'success', texto: 'Cliente encontrado, continuemos con la cita.' });
      } else {
        cliente = await clientesService.crear({
          nombre,
          email,
          telefono: telefono || undefined,
        });
        setMensaje({ tipo: 'success', texto: 'Cliente registrado correctamente.' });
      }

      setClienteSeleccionado({
        clienteId: cliente.clienteId,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
      });
      setPaso(2);
    } catch (error: any) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'No fue posible identificar al cliente',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOmitirCliente = () => {
    setClienteSeleccionado(null);
    setPaso(2);
    setMensaje(null);
  };

  const handleCambiarCliente = () => {
    setPaso(1);
  };

  const handlePagoInputChange = (
    field: 'numeroTarjeta' | 'nombreTitular' | 'mesExp' | 'anioExp' | 'cvv',
    value: string,
  ) => {
    setPagoForm((prev) => ({ ...prev, [field]: value }));
  };

  const cargarServicios = async () => {
    try {
      const serviciosData = await serviciosService.obtenerServicios(sucursalId);
      setServicios(serviciosData.filter(s => s.activo));
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar los servicios' });
    }
  };

  const cargarDiasDisponibles = async (diasRango: number) => {
    if (!servicioSeleccionado) return;

    setLoading(true);
    try {
      // Calcular rango de días solicitado
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaFin = new Date(hoy);
      fechaFin.setDate(fechaFin.getDate() + diasRango);

      const fechaInicioISO = hoy.toISOString();
      const fechaFinISO = fechaFin.toISOString();

      // Consultar disponibilidad para todas las semanas
      const slots = await disponibilidadService.checkDisponibilidad({
        servicioId: servicioSeleccionado.servicioId,
        sucursalId,
        fechaInicio: fechaInicioISO,
        fechaFin: fechaFinISO,
      });

      // Filtrar solo slots disponibles y agrupar por día
      const slotsDisponibles = slots.filter(slot => slot.disponible);
      const diasConSlots = new Set<string>();

      slotsDisponibles.forEach(slot => {
        const fecha = new Date(slot.fechaInicio);
        const fechaStr = fecha.toISOString().split('T')[0];
        diasConSlots.add(fechaStr);
      });

      // Crear array de días con disponibilidad
      const dias: DiaConDisponibilidad[] = [];
      const fechaActual = new Date(hoy);
      
      while (fechaActual <= fechaFin) {
        const fechaStr = fechaActual.toISOString().split('T')[0];
        dias.push({
          fecha: new Date(fechaActual),
          tieneDisponibilidad: diasConSlots.has(fechaStr),
        });
        fechaActual.setDate(fechaActual.getDate() + 1);
      }

      setDiasDisponibles(dias);
      
      if (dias.filter(d => d.tieneDisponibilidad).length === 0) {
        setMensaje({ tipo: 'error', texto: 'No hay disponibilidad en las próximas semanas' });
      }
    } catch (error: any) {
      console.error('Error al cargar días disponibles:', error);
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al cargar disponibilidad',
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarBarberos = async () => {
    try {
      const barberosData = await barberosService.obtenerBarberos(sucursalId);
      setBarberos(barberosData.filter(b => b.activo));
    } catch (error) {
      console.error('Error al cargar barberos:', error);
    }
  };

  const cargarHorariosDelDia = async () => {
    if (!diaSeleccionado || !servicioSeleccionado) return;

    setLoading(true);
    try {
      // Calcular inicio y fin del día seleccionado
      const inicioDia = new Date(diaSeleccionado);
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date(diaSeleccionado);
      finDia.setHours(23, 59, 59, 999);

      const slots = await disponibilidadService.checkDisponibilidad({
        servicioId: servicioSeleccionado.servicioId,
        sucursalId,
        fechaInicio: inicioDia.toISOString(),
        fechaFin: finDia.toISOString(),
        barberoId: barberoFiltro || undefined,
      });

      // Filtrar solo slots disponibles y ordenar por hora
      const slotsDisponibles = slots
        .filter(slot => slot.disponible)
        .sort((a, b) => {
          const fechaA = new Date(a.fechaInicio).getTime();
          const fechaB = new Date(b.fechaInicio).getTime();
          return fechaA - fechaB;
        });

      setSlotsDelDia(slotsDisponibles);
      
      if (slotsDisponibles.length === 0) {
        setMensaje({ tipo: 'error', texto: 'No hay horarios disponibles para este día' });
      } else {
        setMensaje(null);
      }
    } catch (error: any) {
      console.error('Error al cargar horarios:', error);
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al cargar horarios',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarServicio = (servicio: Servicio) => {
    setServicioSeleccionado(servicio);
    setRangoDiasDisponibles(DIAS_RANGO_INICIAL);
    setDiasDisponibles([]);
    setDiaSeleccionado(null);
    setPaso(3);
    setMensaje(null);
  };

  const handleCargarMasDias = () => {
    setRangoDiasDisponibles((prev) => prev + DIAS_RANGO_INCREMENTO);
  };

  const cancelarVentaPendiente = async (motivo?: string) => {
    if (!ventaCreada?.ventaId) return;
    try {
      await ventasService.cancelarVenta(ventaCreada.ventaId, motivo);
    } catch (error) {
      console.error('No se pudo cancelar la venta', error);
    } finally {
      setVentaCreada(null);
    }
  };

  const cancelarCitaAnterior = async () => {
    if (!citaReservadaId) return;
    try {
      await citasApi.cancelarCita(citaReservadaId);
    } catch (error) {
      console.error('No se pudo cancelar la cita anterior', error);
    } finally {
      setCitaReservadaId(null);
    }
  };

  const resetVentaYCita = async () => {
    await cancelarVentaPendiente('Reagendado');
    await cancelarCitaAnterior();
    setComprobanteGenerado(null);
    setPagoCompletado(false);
  };

  const handleSeleccionarDia = async (dia: Date) => {
    if (!dia) return;
    await resetVentaYCita();
    setDiaSeleccionado(dia);
    setPaso(4);
    setBarberoFiltro(null);
    setSlotSeleccionado(null);
    setMensaje(null);
  };

  const handleSeleccionarBarbero = (barberoId: number | null) => {
    setBarberoFiltro(barberoId);
    setSlotSeleccionado(null);
  };

  const handleSeleccionarHorario = async (slot: SlotDisponible) => {
    await resetVentaYCita();
    setSlotSeleccionado(slot);
    setPaso(5);
    setMensaje(null);
  };

  const handleConfirmarCita = async () => {
    if (!slotSeleccionado || !servicioSeleccionado || !slotSeleccionado.barberoId) {
      setMensaje({ tipo: 'error', texto: 'Por favor completa todos los campos' });
      return;
    }

    if (ventaCreada) {
      setPaso(6);
      return;
    }

    setLoading(true);
    setMensaje(null);

    try {
      const fechaInicio =
        slotSeleccionado.fechaInicio instanceof Date
          ? slotSeleccionado.fechaInicio.toISOString()
          : new Date(slotSeleccionado.fechaInicio).toISOString();

      const fechaFin =
        slotSeleccionado.fechaFin instanceof Date
          ? slotSeleccionado.fechaFin.toISOString()
          : new Date(slotSeleccionado.fechaFin).toISOString();

      const cita = await citasService.reservarCita({
        servicioId: servicioSeleccionado.servicioId,
        sucursalId,
        barberoId: slotSeleccionado.barberoId,
        clienteId: clienteSeleccionado?.clienteId,
        fechaInicio,
        fechaFin,
        origen: 'WEB',
      });

      setCitaReservadaId(cita.citaId);

      const precio = Number(servicioSeleccionado.precio) || 0;
      const venta = await ventasService.crearVenta({
        clienteId: clienteSeleccionado?.clienteId,
        sucursalId,
        estadoVentaId: estadoVentaPendienteId,
        origen: 'WEB',
        ventaLineas: [
          {
            tipoItem: 'SERVICIO',
            servicioId: servicioSeleccionado.servicioId,
            priceUnit: precio,
            quantity: 1,
            discountAmount: 0,
            citaId: cita.citaId,
          },
        ],
      });

      setVentaCreada(venta);
      setMensaje({
        tipo: 'success',
        texto: 'Cita reservada correctamente. Ahora finalicemos el pago.',
      });
      setPaso(6);
    } catch (error: any) {
      console.error('Error al confirmar cita/venta', error);
      setMensaje({
        tipo: 'error',
        texto:
          error.response?.data?.message ||
          'No fue posible completar la reserva. Intenta nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: Date): string => {
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatearHora = (fecha: Date | string): string => {
    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
    return fechaObj.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const obtenerPrimerLetraDia = (fecha: Date): string => {
    return fecha.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 1).toUpperCase();
  };

  // Agrupar slots por barbero
  const slotsAgrupadosPorBarbero = slotsDelDia.reduce((acc, slot) => {
    const barberoId = slot.barberoId || 0;
    const barberoNombre = slot.barberoNombre || `Barbero ${barberoId}`;
    
    if (!acc[barberoId]) {
      acc[barberoId] = {
        barberoId,
        barberoNombre,
        slots: [],
      };
    }
    acc[barberoId].slots.push(slot);
    return acc;
  }, {} as Record<number, { barberoId: number; barberoNombre: string; slots: SlotDisponible[] }>);

  // Función para obtener iniciales del barbero
  const obtenerIniciales = (nombre: string): string => {
    return nombre
      .split(' ')
      .map(palabra => palabra[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleProcesarPago = async () => {
    if (!ventaCreada) {
      setMensaje({
        tipo: 'error',
        texto: 'No se encontró la venta asociada. Regresa e intenta de nuevo.',
      });
      return;
    }

    const { numeroTarjeta, nombreTitular, mesExp, anioExp, cvv } = pagoForm;
    if (!numeroTarjeta || !nombreTitular || !mesExp || !anioExp || !cvv) {
      setMensaje({ tipo: 'error', texto: 'Completa todos los datos de pago.' });
      return;
    }

    setProcesandoPago(true);
    setMensaje(null);

    try {
      await transaccionesService.iniciarPagoVenta(ventaCreada.ventaId, {
        NumeroTarjetaOrigen: numeroTarjeta,
        NombreCliente: nombreTitular,
        MesExp: Number(mesExp),
        AnioExp: Number(anioExp),
        Cvv: cvv,
        Monto: ventaCreada.totalNeto,
      });
      const comprobante = await comprobantesService.generar({
        ventaId: ventaCreada.ventaId,
        serie: 'WEB',
      });
      setComprobanteGenerado(comprobante);
      setPagoCompletado(true);
      setMensaje({
        tipo: 'success',
        texto: 'Pago aprobado. Descarga tu comprobante.',
      });
    } catch (error: any) {
      console.error('Pago rechazado', error);
      setMensaje({
        tipo: 'error',
        texto: 'Pago no aprobado. Verifica tu método e intenta de nuevo.',
      });
    } finally {
      setProcesandoPago(false);
    }
  };

  const handleCancelarFlujo = async () => {
    setProcesandoPago(true);
    try {
      await cancelarVentaPendiente('Cancelado por el usuario');
      await cancelarCitaAnterior();
      setMensaje({
        tipo: 'success',
        texto: 'La cita se canceló y el horario quedó libre.',
      });
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Error al cancelar cita', error);
      setMensaje({
        tipo: 'error',
        texto: 'No pudimos cancelar la cita. Inténtalo nuevamente.',
      });
      setProcesandoPago(false);
    }
  };

  const handleFinalizar = () => {
    navigate('/');
  };

  return (
    <div className="agendar-cita-container">
      <div className="agendar-cita-card">
        <div className="header-agendar">
          <button className="btn-volver" onClick={() => navigate('/')}>
            ← Volver
          </button>
          <h1>Agendar Cita</h1>
          <div className="paso-indicador">
            Paso {paso} de 6
          </div>
        </div>

        {/* Indicador de progreso */}
        <div className="progreso-steps">
          <div className={`step ${paso >= 1 ? 'active' : ''} ${paso > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Cliente</div>
          </div>
          <div className={`step ${paso >= 2 ? 'active' : ''} ${paso > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Servicio</div>
          </div>
          <div className={`step ${paso >= 3 ? 'active' : ''} ${paso > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Día</div>
          </div>
          <div className={`step ${paso >= 4 ? 'active' : ''} ${paso > 4 ? 'completed' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Barbero</div>
          </div>
          <div className={`step ${paso >= 5 ? 'active' : ''}`}>
            <div className="step-number">5</div>
            <div className="step-label">Confirmar</div>
          </div>
          <div className={`step ${paso >= 6 ? 'active' : ''}`}>
            <div className="step-number">6</div>
            <div className="step-label">Pago</div>
          </div>
        </div>

        {paso > 1 && (
          <div className="servicio-seleccionado-info cliente-resumen">
            <div>
              Cliente:{' '}
              <strong>
                {clienteSeleccionado ? clienteSeleccionado.nombre : 'Sin registrar'}
              </strong>
              {clienteSeleccionado?.email && <> • {clienteSeleccionado.email}</>}
            </div>
            <button className="btn-volver-paso" onClick={handleCambiarCliente}>
              Cambiar cliente
            </button>
          </div>
        )}

        {mensaje && (
          <div className={`mensaje ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Cargando...</p>
          </div>
        )}

        {/* PASO 1: Cliente */}
        {paso === 1 && (
          <div className="paso-contenido">
            <h2>Cuéntanos quién agenda la cita</h2>
            <p className="servicio-seleccionado-info">
              Usa tu nombre y correo para que podamos reconocer tu historial o crear tu registro.
            </p>

            <div className="form-group">
              <label>Nombre completo *</label>
              <input
                type="text"
                value={clienteForm.nombre}
                onChange={(e) => handleClienteInputChange('nombre', e.target.value)}
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div className="form-group">
              <label>Correo electrónico *</label>
              <input
                type="email"
                value={clienteForm.email}
                onChange={(e) => handleClienteInputChange('email', e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="form-group">
              <label>Teléfono (opcional)</label>
              <input
                type="tel"
                value={clienteForm.telefono}
                onChange={(e) => handleClienteInputChange('telefono', e.target.value)}
                placeholder="5551234567"
              />
            </div>

            <div className="acciones-cliente">
              <button
                className="btn-confirmar"
                onClick={handleIdentificarCliente}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Continuar'}
              </button>
              <button
                className="btn-volver-paso"
                onClick={handleOmitirCliente}
                type="button"
              >
                Omitir por ahora
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Seleccionar Servicio */}
        {paso === 2 && (
          <div className="paso-contenido">
            <h2>Selecciona un servicio</h2>
            <div className="servicios-grid">
              {servicios.map((servicio) => (
                <div
                  key={servicio.servicioId}
                  className="servicio-card"
                  onClick={() => handleSeleccionarServicio(servicio)}
                >
                  <div className="servicio-header">
                    <h3>{servicio.nombre}</h3>
                    <span className="servicio-precio">${servicio.precio} MXN</span>
                  </div>
                  {servicio.descripcion && (
                    <p className="servicio-descripcion">{servicio.descripcion}</p>
                  )}
                  <div className="servicio-footer">
                    <span className="servicio-duracion">
                      ⏱ {servicio.duracionMinutos} min
                    </span>
                    <button className="btn-reservar-servicio">Reservar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 3: Seleccionar Día */}
        {paso === 3 && servicioSeleccionado && (
          <div className="paso-contenido">
            <div className="paso-header">
              <h2>Selecciona un día</h2>
              <button className="btn-volver-paso" onClick={() => setPaso(2)}>
                ← Cambiar servicio
              </button>
            </div>
            <p className="servicio-seleccionado-info">
              Servicio: <strong>{servicioSeleccionado.nombre}</strong>
            </p>
            
            <div className="calendario-grid">
              {diasDisponibles.map((dia, index) => {
                const esHoy = dia.fecha.toDateString() === new Date().toDateString();
                const esSeleccionado = diaSeleccionado?.toDateString() === dia.fecha.toDateString();
                
                return (
                  <div
                    key={index}
                    className={`dia-calendario ${dia.tieneDisponibilidad ? 'disponible' : 'no-disponible'} ${esHoy ? 'hoy' : ''} ${esSeleccionado ? 'seleccionado' : ''}`}
                    onClick={() => dia.tieneDisponibilidad && handleSeleccionarDia(dia.fecha)}
                  >
                    <div className="dia-semana">{obtenerPrimerLetraDia(dia.fecha)}</div>
                    <div className="dia-numero">{dia.fecha.getDate()}</div>
                    {dia.tieneDisponibilidad && (
                      <div className="dia-indicador">●</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="acciones-calendario">
              <button
                className="btn-volver-paso"
                type="button"
                onClick={handleCargarMasDias}
                disabled={loading}
              >
                Cargar {DIAS_RANGO_INCREMENTO} días más
              </button>
              <span className="rango-dias-indicador">Mostrando {rangoDiasDisponibles} días</span>
            </div>
          </div>
        )}

        {/* PASO 4: Seleccionar Barbero y Horario */}
        {paso === 4 && diaSeleccionado && servicioSeleccionado && (
          <div className="paso-contenido">
            <div className="paso-header">
              <h2>Selecciona barbero y horario</h2>
              <button className="btn-volver-paso" onClick={() => setPaso(3)}>
                ← Cambiar día
              </button>
            </div>
            <p className="servicio-seleccionado-info">
              Servicio: <strong>{servicioSeleccionado.nombre}</strong> • 
              Día: <strong>{formatearFecha(diaSeleccionado)}</strong>
            </p>

            {/* Selector de Barbero */}
            <div className="barberos-selector">
              <div
                className={`barbero-chip ${barberoFiltro === null ? 'seleccionado' : ''}`}
                onClick={() => handleSeleccionarBarbero(null)}
              >
                <div className="barbero-avatar placeholder">👤</div>
                <span>Cualquier barbero</span>
              </div>
              {barberos.map((barbero) => (
                <div
                  key={barbero.barberoId}
                  className={`barbero-chip ${barberoFiltro === barbero.barberoId ? 'seleccionado' : ''}`}
                  onClick={() => handleSeleccionarBarbero(barbero.barberoId)}
                >
                  <div className="barbero-avatar">
                    {obtenerIniciales(barbero.nombre)}
                  </div>
                  <span>{barbero.nombre}</span>
                </div>
              ))}
            </div>

            {/* Lista de Horarios */}
            <div className="horarios-section">
              <h3>Horarios disponibles</h3>
              {slotsDelDia.length === 0 ? (
                <p className="sin-disponibilidad">No hay horarios disponibles</p>
              ) : barberoFiltro === null ? (
                // Mostrar agrupado por barbero
                <div className="horarios-por-barbero">
                  {Object.values(slotsAgrupadosPorBarbero).map((grupo) => (
                    <div key={grupo.barberoId} className="barbero-horarios-grupo">
                      <div className="barbero-horarios-header">
                        <div className="barbero-avatar">
                          {obtenerIniciales(grupo.barberoNombre)}
                        </div>
                        <span>{grupo.barberoNombre}</span>
                      </div>
                      <div className="horarios-grid">
                        {grupo.slots.map((slot, index) => (
                          <button
                            key={index}
                            className="horario-slot"
                            onClick={() => handleSeleccionarHorario(slot)}
                          >
                            {formatearHora(slot.fechaInicio)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Mostrar solo horarios del barbero seleccionado
                <div className="horarios-grid">
                  {slotsDelDia.map((slot, index) => (
                    <button
                      key={index}
                      className="horario-slot"
                      onClick={() => handleSeleccionarHorario(slot)}
                    >
                      {formatearHora(slot.fechaInicio)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 5: Confirmar Cita */}
        {paso === 5 && slotSeleccionado && servicioSeleccionado && diaSeleccionado && (
          <div className="paso-contenido">
            <div className="paso-header">
              <h2>Revisar y confirmar</h2>
              <button className="btn-volver-paso" onClick={() => setPaso(4)}>
                ← Cambiar horario
              </button>
            </div>

            <div className="confirmacion-detalles">
              <div className="detalle-grupo">
                <h3>Servicio</h3>
                <div className="detalle-item">
                  <span className="detalle-label">Servicio:</span>
                  <span className="detalle-valor">{servicioSeleccionado.nombre}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Duración:</span>
                  <span className="detalle-valor">{servicioSeleccionado.duracionMinutos} minutos</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Precio:</span>
                  <span className="detalle-valor precio">${servicioSeleccionado.precio} MXN</span>
                </div>
              </div>

              <div className="detalle-grupo">
                <h3>Cita</h3>
                <div className="detalle-item">
                  <span className="detalle-label">📅 Fecha:</span>
                  <span className="detalle-valor">{diaSeleccionado.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">🕐 Hora:</span>
                  <span className="detalle-valor">
                    {formatearHora(slotSeleccionado.fechaInicio)} - {formatearHora(slotSeleccionado.fechaFin)}
                  </span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">👤 Barbero:</span>
                  <span className="detalle-valor">{slotSeleccionado.barberoNombre || `Barbero ${slotSeleccionado.barberoId}`}</span>
                </div>
              </div>

              <div className="detalle-grupo">
                <h3>Cliente</h3>
                {clienteSeleccionado ? (
                  <>
                    <div className="detalle-item">
                      <span className="detalle-label">👤 Nombre:</span>
                      <span className="detalle-valor">{clienteSeleccionado.nombre}</span>
                    </div>
                    {clienteSeleccionado.email && (
                      <div className="detalle-item">
                        <span className="detalle-label">📧 Correo:</span>
                        <span className="detalle-valor">{clienteSeleccionado.email}</span>
                      </div>
                    )}
                    {clienteSeleccionado.telefono && (
                      <div className="detalle-item">
                        <span className="detalle-label">📱 Teléfono:</span>
                        <span className="detalle-valor">{clienteSeleccionado.telefono}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="detalle-item">
                    <span className="detalle-label">⚠️</span>
                    <span className="detalle-valor">
                      La cita se registrará sin cliente. Puedes{' '}
                      <button className="btn-volver-paso" onClick={handleCambiarCliente}>
                        agregar uno aquí
                      </button>
                      .
                    </span>
                  </div>
                )}
              </div>

              <div className="detalle-grupo total-section">
                <div className="detalle-item total">
                  <span className="detalle-label">Total:</span>
                  <span className="detalle-valor precio total-precio">${servicioSeleccionado.precio} MXN</span>
                </div>
              </div>
            </div>

            <button
              className="btn-confirmar"
              onClick={handleConfirmarCita}
              disabled={loading}
            >
              {loading ? 'Confirmando...' : 'Confirmar Cita'}
            </button>
          </div>
        )}

        {/* PASO 6: Pago */}
        {paso === 6 && ventaCreada && (
          <div className="paso-contenido">
            <div className="paso-header">
              <h2>Pagar cita</h2>
              {!pagoCompletado && (
                <button className="btn-volver-paso" onClick={() => setPaso(5)}>
                  ← Revisar detalles
                </button>
              )}
            </div>

            {!pagoCompletado && (
              <>
                <p className="servicio-seleccionado-info">
                  Total a pagar:{' '}
                  <strong>
                    ${Number(ventaCreada.totalNeto ?? 0).toFixed(2)} MXN
                  </strong>{' '}
                  • Código: <strong>{ventaCreada.orderCode}</strong>
                </p>

                <div className="form-group">
                  <label>Nombre del titular *</label>
                  <input
                    type="text"
                    value={pagoForm.nombreTitular}
                    onChange={(e) => handlePagoInputChange('nombreTitular', e.target.value)}
                    placeholder="Como aparece en la tarjeta"
                  />
                </div>

                <div className="form-group">
                  <label>Número de tarjeta *</label>
                  <input
                    type="text"
                    value={pagoForm.numeroTarjeta}
                    onChange={(e) => handlePagoInputChange('numeroTarjeta', e.target.value)}
                    placeholder="4111 1111 1111 1111"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Mes exp.</label>
                    <input
                      type="text"
                      value={pagoForm.mesExp}
                      onChange={(e) => handlePagoInputChange('mesExp', e.target.value)}
                      placeholder="MM"
                    />
                  </div>
                  <div className="form-group">
                    <label>Año exp.</label>
                    <input
                      type="text"
                      value={pagoForm.anioExp}
                      onChange={(e) => handlePagoInputChange('anioExp', e.target.value)}
                      placeholder="YYYY"
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="password"
                      value={pagoForm.cvv}
                      onChange={(e) => handlePagoInputChange('cvv', e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="acciones-cliente">
                  <button
                    className="btn-confirmar"
                    onClick={handleProcesarPago}
                    disabled={procesandoPago}
                  >
                    {procesandoPago ? 'Procesando pago...' : 'Pagar y finalizar'}
                  </button>
                  <button
                    type="button"
                    className="btn-volver-paso"
                    onClick={handleCancelarFlujo}
                    disabled={procesandoPago}
                  >
                    Cancelar y liberar cita
                  </button>
                </div>
              </>
            )}

            {pagoCompletado && comprobanteGenerado && (
              <div className="comprobante-card">
                <h3>Comprobante generado</h3>
                <p>Serie: <strong>{comprobanteGenerado.serie}</strong></p>
                <p>Folio: <strong>{comprobanteGenerado.folio}</strong></p>
                <p>Fecha: <strong>{new Date(comprobanteGenerado.fechaGeneracion).toLocaleString()}</strong></p>
                <p>Total pagado: <strong>${Number(ventaCreada.totalNeto ?? 0).toFixed(2)} MXN</strong></p>
                {clienteSeleccionado && (
                  <p>Cliente: <strong>{clienteSeleccionado.nombre}</strong></p>
                )}
                <p>Servicio: <strong>{servicioSeleccionado?.nombre}</strong></p>
                {slotSeleccionado && (
                  <p>
                    Cita:{' '}
                    <strong>
                      {new Date(slotSeleccionado.fechaInicio).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}{' '}
                      {new Date(slotSeleccionado.fechaInicio).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </p>
                )}

                <div className="acciones-cliente">
                  <button className="btn-confirmar" onClick={handleFinalizar}>
                    Finalizar
                  </button>
                  <button className="btn-volver-paso" onClick={() => window.print()}>
                    Imprimir
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendarCita;