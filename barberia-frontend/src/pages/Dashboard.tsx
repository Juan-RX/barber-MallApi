import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, type Cliente } from '../services/auth.service';
import { citasService, type Cita } from '../services/citas.service';
import { ventasService, type Venta, type VentaLinea } from '../services/ventas.service';
import { transaccionesService, type TransaccionPago } from '../services/transacciones.service';
import './Dashboard.css';

type Apartado = 'citas' | 'ventas' | 'transacciones' | null;

const Dashboard = () => {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [apartadoSeleccionado, setApartadoSeleccionado] = useState<Apartado>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [ventaLineas, setVentaLineas] = useState<VentaLinea[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [transacciones, setTransacciones] = useState<TransaccionPago[]>([]);
  const [loadingTransacciones, setLoadingTransacciones] = useState(false);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Obtener información del cliente
    const clienteData = authService.getCliente();
    if (!clienteData) {
      navigate('/login');
      return;
    }

    setCliente(clienteData);
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Cargar citas cuando se selecciona el apartado
  useEffect(() => {
    if (apartadoSeleccionado === 'citas') {
      cargarCitas();
    }
  }, [apartadoSeleccionado]);

  // Cargar ventas cuando se selecciona el apartado
  useEffect(() => {
    if (apartadoSeleccionado === 'ventas') {
      cargarVentas();
    }
  }, [apartadoSeleccionado]);

  // Cargar transacciones cuando se selecciona el apartado
  useEffect(() => {
    if (apartadoSeleccionado === 'transacciones') {
      cargarTransacciones();
    }
  }, [apartadoSeleccionado]);

  const cargarCitas = async () => {
    setLoadingCitas(true);
    try {
      const citasData = await citasService.obtenerTodasLasCitas();
      setCitas(citasData);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoadingCitas(false);
    }
  };

  const cargarVentas = async () => {
    setLoadingVentas(true);
    try {
      const [ventasData, ventaLineasData] = await Promise.all([
        ventasService.obtenerTodasLasVentas(),
        ventasService.obtenerTodasLasVentaLineas(),
      ]);
      setVentas(ventasData);
      setVentaLineas(ventaLineasData);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoadingVentas(false);
    }
  };

  const cargarTransacciones = async () => {
    setLoadingTransacciones(true);
    try {
      const transaccionesData = await transaccionesService.obtenerTodasLasTransacciones();
      setTransacciones(transaccionesData);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    } finally {
      setLoadingTransacciones(false);
    }
  };

  const formatearFecha = (fecha: string | Date | undefined): string => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!cliente) {
    return (
      <div className="app">
        <div className="loading-container">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Barbería</h1>
        <nav className="nav">
          <span className="nav-user">Bienvenido, {cliente.nombre}</span>
          <button className="btn-logout" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </nav>
      </header>

      <main className="main dashboard-main">
        <div className="dashboard-layout">
          {/* Sidebar */}
          <aside className="dashboard-sidebar">
            <h3 className="sidebar-title">Menú</h3>
            <nav className="sidebar-nav">
              <button
                className={`sidebar-item ${apartadoSeleccionado === 'citas' ? 'active' : ''}`}
                onClick={() => setApartadoSeleccionado('citas')}
              >
                Tabla de Citas
              </button>
              <button
                className={`sidebar-item ${apartadoSeleccionado === 'ventas' ? 'active' : ''}`}
                onClick={() => setApartadoSeleccionado('ventas')}
              >
                Tabla de Ventas
              </button>
              <button
                className={`sidebar-item ${apartadoSeleccionado === 'transacciones' ? 'active' : ''}`}
                onClick={() => setApartadoSeleccionado('transacciones')}
              >
                Tabla de Transacciones
              </button>
            </nav>
          </aside>

          {/* Contenido */}
          <div className="dashboard-content-area">
            {!apartadoSeleccionado && (
              <div className="dashboard-welcome-content">
                <div className="dashboard-welcome">
                  <h2>Panel de Control</h2>
                  <p>Bienvenido al sistema de gestión de la barbería</p>
                </div>

                <div className="dashboard-content">
                  <div className="dashboard-card">
                    <h3>Información del Usuario</h3>
                    <div className="info-group">
                      <p><strong>Nombre:</strong> {cliente.nombre}</p>
                      {cliente.email && (
                        <p><strong>Email:</strong> {cliente.email}</p>
                      )}
                      {cliente.telefono && (
                        <p><strong>Teléfono:</strong> {cliente.telefono}</p>
                      )}
                      {cliente.codigoExterno && (
                        <p><strong>Código Externo:</strong> {cliente.codigoExterno}</p>
                      )}
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h3>Funcionalidades</h3>
                    <p>Selecciona un apartado del menú lateral para acceder a las diferentes funcionalidades del sistema.</p>
                  </div>
                </div>
              </div>
            )}

            {apartadoSeleccionado === 'citas' && (
              <div className="content-section">
                <h2>Tabla de Citas</h2>
                {loadingCitas ? (
                  <div className="loading-container">
                    <p>Cargando citas...</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Cliente</th>
                          <th>Servicio</th>
                          <th>Barbero</th>
                          <th>Sucursal</th>
                          <th>Fecha Inicio</th>
                          <th>Fecha Fin</th>
                          <th>Estado</th>
                          <th>Origen</th>
                          <th>Slot ID Mall</th>
                          <th>Notas</th>
                          <th>Creado</th>
                          <th>Actualizado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {citas.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="no-data">
                              No hay citas registradas
                            </td>
                          </tr>
                        ) : (
                          citas.map((cita) => (
                            <tr key={cita.citaId}>
                              <td>{cita.citaId}</td>
                              <td>
                                {cita.cliente?.nombre || `ID: ${cita.clienteId}`}
                                {cita.cliente?.email && (
                                  <div className="sub-text">{cita.cliente.email}</div>
                                )}
                              </td>
                              <td>
                                {cita.servicio?.nombre || `ID: ${cita.servicioId}`}
                                {cita.servicio?.codigoExterno && (
                                  <div className="sub-text">{cita.servicio.codigoExterno}</div>
                                )}
                              </td>
                              <td>
                                {cita.barbero
                                  ? `${cita.barbero.nombre} ${cita.barbero.apellido || ''}`.trim()
                                  : cita.barberoId
                                  ? `ID: ${cita.barberoId}`
                                  : '-'}
                              </td>
                              <td>{cita.sucursal?.nombre || (cita.sucursalId ? `ID: ${cita.sucursalId}` : '-')}</td>
                              <td>{formatearFecha(cita.fechaInicio)}</td>
                              <td>{formatearFecha(cita.fechaFin)}</td>
                              <td>
                                <span className={`estado-badge estado-${cita.estadoCita?.codigo?.toLowerCase() || 'desconocido'}`}>
                                  {cita.estadoCita?.codigo || `ID: ${cita.estadoCitaId}`}
                                </span>
                              </td>
                              <td>{cita.origen || '-'}</td>
                              <td>{cita.slotIdMall || '-'}</td>
                              <td className="notas-cell">{cita.notas || '-'}</td>
                              <td>{formatearFecha(cita.createdAt)}</td>
                              <td>{formatearFecha(cita.updatedAt)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {apartadoSeleccionado === 'ventas' && (
              <div className="content-section">
                <h2>Tabla de Ventas</h2>
                {loadingVentas ? (
                  <div className="loading-container">
                    <p>Cargando ventas...</p>
                  </div>
                ) : (
                  <>
                    <div className="table-section">
                      <h3>Ventas</h3>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Order Code</th>
                              <th>Cliente</th>
                              <th>Sucursal</th>
                              <th>Estado</th>
                              <th>Total Bruto</th>
                              <th>Descuento</th>
                              <th>Total Neto</th>
                              <th>Origen</th>
                              <th>Comentarios</th>
                              <th>Código Confirmación</th>
                              <th>Creado</th>
                              <th>Actualizado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ventas.length === 0 ? (
                              <tr>
                                <td colSpan={13} className="no-data">
                                  No hay ventas registradas
                                </td>
                              </tr>
                            ) : (
                              ventas.map((venta) => (
                                <tr key={venta.ventaId}>
                                  <td>{venta.ventaId}</td>
                                  <td>{venta.orderCode}</td>
                                  <td>
                                    {venta.cliente?.nombre || (venta.clienteId ? `ID: ${venta.clienteId}` : '-')}
                                    {venta.cliente?.email && (
                                      <div className="sub-text">{venta.cliente.email}</div>
                                    )}
                                  </td>
                                  <td>{venta.sucursal?.nombre || `ID: ${venta.sucursalId}`}</td>
                                  <td>
                                    <span className={`estado-badge estado-${venta.estadoVenta?.codigo?.toLowerCase() || 'desconocido'}`}>
                                      {venta.estadoVenta?.codigo || `ID: ${venta.estadoVentaId}`}
                                    </span>
                                  </td>
                                  <td>${parseFloat(venta.totalBruto.toString()).toFixed(2)}</td>
                                  <td>${parseFloat(venta.descuentoTotal.toString()).toFixed(2)}</td>
                                  <td>${parseFloat(venta.totalNeto.toString()).toFixed(2)}</td>
                                  <td>{venta.origen || '-'}</td>
                                  <td className="notas-cell">{venta.comentarios || '-'}</td>
                                  <td>{venta.confirmationCode || '-'}</td>
                                  <td>{formatearFecha(venta.createdAt)}</td>
                                  <td>{formatearFecha(venta.updatedAt)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="table-section" style={{ marginTop: '3rem' }}>
                      <h3>Líneas de Venta</h3>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Venta ID</th>
                              <th>Tipo Item</th>
                              <th>Servicio</th>
                              <th>Producto</th>
                              <th>Cita ID</th>
                              <th>Cantidad</th>
                              <th>Precio Unitario</th>
                              <th>Descuento</th>
                              <th>Precio Total</th>
                              <th>Service External ID</th>
                              <th>Product External ID</th>
                              <th>Appointment Time</th>
                              <th>Size</th>
                              <th>Color</th>
                              <th>Options</th>
                              <th>Creado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ventaLineas.length === 0 ? (
                              <tr>
                                <td colSpan={17} className="no-data">
                                  No hay líneas de venta registradas
                                </td>
                              </tr>
                            ) : (
                              ventaLineas.map((linea) => (
                                <tr key={linea.ventaLineaId}>
                                  <td>{linea.ventaLineaId}</td>
                                  <td>{linea.ventaId}</td>
                                  <td>
                                    <span className={`estado-badge estado-${linea.tipoItem?.toLowerCase() || 'desconocido'}`}>
                                      {linea.tipoItem}
                                    </span>
                                  </td>
                                  <td>
                                    {linea.servicio?.nombre || (linea.servicioId ? `ID: ${linea.servicioId}` : '-')}
                                    {linea.servicio?.codigoExterno && (
                                      <div className="sub-text">{linea.servicio.codigoExterno}</div>
                                    )}
                                  </td>
                                  <td>
                                    {linea.producto?.nombre || (linea.productoId ? `ID: ${linea.productoId}` : '-')}
                                    {linea.producto?.codigoExterno && (
                                      <div className="sub-text">{linea.producto.codigoExterno}</div>
                                    )}
                                  </td>
                                  <td>{linea.citaId || '-'}</td>
                                  <td>{linea.quantity}</td>
                                  <td>${parseFloat(linea.priceUnit.toString()).toFixed(2)}</td>
                                  <td>${parseFloat(linea.discountAmount.toString()).toFixed(2)}</td>
                                  <td>${parseFloat(linea.priceTotal.toString()).toFixed(2)}</td>
                                  <td>{linea.serviceExternalId || '-'}</td>
                                  <td>{linea.productExternalId || '-'}</td>
                                  <td>{formatearFecha(linea.appointmentTime)}</td>
                                  <td>{linea.size || '-'}</td>
                                  <td>{linea.color || '-'}</td>
                                  <td className="notas-cell">{linea.options || '-'}</td>
                                  <td>{formatearFecha(linea.createdAt)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {apartadoSeleccionado === 'transacciones' && (
              <div className="content-section">
                <h2>Tabla de Transacciones</h2>
                {loadingTransacciones ? (
                  <div className="loading-container">
                    <p>Cargando transacciones...</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Venta ID</th>
                          <th>Order Code</th>
                          <th>Código Negocio</th>
                          <th>Transacción Externa ID</th>
                          <th>Tipo</th>
                          <th>Monto</th>
                          <th>Descripción</th>
                          <th>Estado</th>
                          <th>Número Tarjeta</th>
                          <th>Estado Banco ID</th>
                          <th>Firma</th>
                          <th>Creada UTC</th>
                          <th>Banco Payload</th>
                          <th>Creado</th>
                          <th>Actualizado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transacciones.length === 0 ? (
                          <tr>
                            <td colSpan={16} className="no-data">
                              No hay transacciones registradas
                            </td>
                          </tr>
                        ) : (
                          transacciones.map((transaccion) => (
                            <tr key={transaccion.transaccionId}>
                              <td>{transaccion.transaccionId}</td>
                              <td>{transaccion.ventaId}</td>
                              <td>{transaccion.venta?.orderCode || '-'}</td>
                              <td>{transaccion.codigoNegocio}</td>
                              <td>{transaccion.transaccionExternaId}</td>
                              <td>{transaccion.tipo || '-'}</td>
                              <td>${parseFloat(transaccion.monto.toString()).toFixed(2)}</td>
                              <td className="notas-cell">{transaccion.descripcion || '-'}</td>
                              <td>
                                <span className={`estado-badge estado-${transaccion.estadoTx?.codigo?.toLowerCase() || 'desconocido'}`}>
                                  {transaccion.estadoTx?.codigo || `ID: ${transaccion.estadoTxId}`}
                                </span>
                              </td>
                              <td>{transaccion.numeroTarjeta || '-'}</td>
                              <td>{transaccion.estadoBancoId || '-'}</td>
                              <td className="notas-cell">{transaccion.firma || '-'}</td>
                              <td>{formatearFecha(transaccion.creadaUtc)}</td>
                              <td className="notas-cell">
                                {transaccion.bancoPayload ? (
                                  <span title={transaccion.bancoPayload}>
                                    {transaccion.bancoPayload.length > 50 
                                      ? `${transaccion.bancoPayload.substring(0, 50)}...` 
                                      : transaccion.bancoPayload}
                                  </span>
                                ) : '-'}
                              </td>
                              <td>{formatearFecha(transaccion.createdAt)}</td>
                              <td>{formatearFecha(transaccion.updatedAt)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Barbería. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Dashboard;

