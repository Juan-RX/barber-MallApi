import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CatalogoService } from './catalogo.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { CreateBarberoDto } from './dto/create-barbero.dto';
import { ServicioMallDto } from './dto/servicio-mall.dto';
import { CatalogoResponseDto } from './dto/catalogo-response.dto';
import { AssignCodigoExternoDto } from './dto/assign-codigo-externo.dto';
import { HorarioService } from '../disponibilidad/horario.service';
import { CreateHorarioSucursalDto } from '../disponibilidad/dto/create-horario-sucursal.dto';
import { CreateHorarioBarberoDto } from '../disponibilidad/dto/create-horario-barbero.dto';
import { CreateExcepcionHorarioDto } from '../disponibilidad/dto/create-excepcion-horario.dto';
import { CreatePausaBarberoDto } from '../disponibilidad/dto/create-pausa-barbero.dto';
import { HorarioSucursal } from '../entities/horario-sucursal.entity';
import { HorarioBarbero } from '../entities/horario-barbero.entity';
import { ExcepcionHorario } from '../entities/excepcion-horario.entity';
import { PausaBarbero } from '../entities/pausa-barbero.entity';

@Controller('catalogo')
export class CatalogoController {
  constructor(
    private readonly catalogoService: CatalogoService,
    private readonly horarioService: HorarioService,
  ) {}

  // ========== SUCURSALES ==========
  @ApiTags('Internos - Catálogo - Sucursales')
  @Post('sucursales')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva sucursal' })
  @ApiResponse({ status: 201, description: 'Sucursal creada exitosamente' })
  createSucursal(@Body() createSucursalDto: CreateSucursalDto) {
    return this.catalogoService.createSucursal(createSucursalDto);
  }

  @ApiTags('Internos - Catálogo - Sucursales')
  @Get('sucursales')
  @ApiOperation({ summary: 'Obtener todas las sucursales' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean, description: 'Filtrar por estado activo' })
  @ApiResponse({ status: 200, description: 'Lista de sucursales' })
  findAllSucursales(@Query('activo') activo?: string) {
    const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.catalogoService.findAllSucursales(activoBool);
  }

  @ApiTags('Internos - Catálogo - Sucursales')
  @Get('sucursales/:id')
  @ApiOperation({ summary: 'Obtener una sucursal por ID' })
  @ApiResponse({ status: 200, description: 'Sucursal encontrada' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  findSucursalById(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoService.findSucursalById(id);
  }

  // ========== HORARIOS DE SUCURSAL ==========
  @ApiTags('Internos - Catálogo - Sucursales')
  @Post('horarios/sucursal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear horario de sucursal' })
  @ApiResponse({ status: 201, description: 'Horario creado exitosamente', type: HorarioSucursal })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  createHorarioSucursal(@Body() createDto: CreateHorarioSucursalDto): Promise<HorarioSucursal> {
    return this.horarioService.createHorarioSucursal(createDto);
  }

  @ApiTags('Internos - Catálogo - Sucursales')
  @Get('horarios/sucursal/:sucursalId')
  @ApiOperation({ summary: 'Obtener horarios de una sucursal' })
  @ApiParam({ name: 'sucursalId', description: 'ID de la sucursal' })
  @ApiResponse({ status: 200, description: 'Lista de horarios', type: [HorarioSucursal] })
  getHorariosSucursal(@Param('sucursalId', ParseIntPipe) sucursalId: number): Promise<HorarioSucursal[]> {
    return this.horarioService.getHorariosSucursal(sucursalId);
  }

  @ApiTags('Internos - Catálogo - Sucursales')
  @Get('horarios/sucursal/:sucursalId/dia')
  @ApiOperation({
    summary: 'Obtener horario de sucursal para un día específico',
    description: 'Retorna el horario considerando excepciones y horarios especiales. Usa formato de fecha: YYYY-MM-DD (ej: 2024-01-15)',
  })
  @ApiParam({ name: 'sucursalId', description: 'ID de la sucursal', example: 1 })
  @ApiQuery({
    name: 'fecha',
    required: true,
    type: String,
    description: 'Fecha en formato YYYY-MM-DD (ej: 2024-01-15) o ISO string',
    example: '2024-01-15',
  })
  @ApiResponse({
    status: 200,
    description: 'Horario del día (puede ser null si la sucursal está cerrada o no tiene horario)',
    type: HorarioSucursal,
  })
  @ApiResponse({ status: 400, description: 'Fecha inválida' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  getHorarioSucursalPorDia(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Query('fecha') fecha: string,
  ) {
    return this.horarioService.getHorarioSucursalPorDia(sucursalId, fecha);
  }

  @ApiTags('Internos - Catálogo - Sucursales')
  @Delete('horarios/sucursal/:id')
  @ApiOperation({ summary: 'Eliminar horario de sucursal' })
  @ApiParam({ name: 'id', description: 'ID del horario' })
  @ApiResponse({ status: 200, description: 'Horario eliminado' })
  deleteHorarioSucursal(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.horarioService.deleteHorarioSucursal(id);
  }

  // ========== SERVICIOS ==========
  @ApiTags('Internos - Catálogo - Servicios')
  @Post('servicios')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo servicio' })
  @ApiResponse({ status: 201, description: 'Servicio creado exitosamente' })
  createServicio(@Body() createServicioDto: CreateServicioDto) {
    return this.catalogoService.createServicio(createServicioDto);
  }

  @ApiTags('Internos - Catálogo - Servicios')
  @Get('servicios')
  @ApiOperation({ summary: 'Obtener todos los servicios' })
  @ApiQuery({ name: 'sucursalId', required: false, type: Number, description: 'Filtrar por sucursal' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean, description: 'Filtrar por estado activo' })
  @ApiResponse({ status: 200, description: 'Lista de servicios' })
  findAllServicios(
    @Query('sucursalId') sucursalId?: string,
    @Query('activo') activo?: string,
  ) {
    const sucursalIdNum = sucursalId ? parseInt(sucursalId) : undefined;
    const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.catalogoService.findAllServicios(sucursalIdNum, activoBool);
  }

  // Rutas con sub-rutas (más específicas) deben ir antes de las genéricas
  @ApiTags('Internos - Catálogo - Servicios')
  @Get('servicios/:id/codigo-externo')
  @ApiOperation({
    summary: 'Verificar si un servicio tiene código externo asignado',
    description: 'Retorna información sobre si el servicio tiene código externo y cuál es',
  })
  @ApiResponse({ status: 200, description: 'Información del código externo' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  verificarCodigoExternoServicio(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoService.verificarCodigoExternoServicio(id);
  }

  @ApiTags('Internos - Catálogo - Servicios')
  @Post('servicios/:id/codigo-externo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Asignar o actualizar el código externo de un servicio',
    description: 'Asigna un código externo a un servicio. Si el código ya está asignado a otro servicio, retorna error.',
  })
  @ApiResponse({ status: 200, description: 'Código externo asignado exitosamente' })
  @ApiResponse({ status: 400, description: 'El código externo ya está asignado a otro servicio' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  asignarCodigoExternoServicio(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssignCodigoExternoDto,
  ) {
    return this.catalogoService.asignarCodigoExternoServicio(id, body.codigoExterno);
  }

  // Rutas genéricas van al final
  @ApiTags('Internos - Catálogo - Servicios')
  @Get('servicios/:id')
  @ApiOperation({ summary: 'Obtener un servicio por ID' })
  @ApiResponse({ status: 200, description: 'Servicio encontrado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  findServicioById(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoService.findServicioById(id);
  }

  // ========== INTERFACES DEL MALL ==========
  @ApiTags('Mall - Catálogo')
  @Get('solicita-catalogo')
  @ApiOperation({
    summary: 'Solicitar catálogo del mall (Interface 3 - SOLICITA_CATALOGO)',
    description:
      'Endpoint para que el mall solicite el catálogo. El mall no envía datos, solo realiza la solicitud. Retorna catálogo en formato Interface 4 - CATALOGO. El parámetro store_id es opcional via query params.',
  })
  @ApiQuery({ name: 'store_id', required: false, type: Number, description: 'ID de la sucursal (opcional)' })
  @ApiResponse({
    status: 200,
    description: 'Catálogo en formato mall (Interface 4 - CATALOGO)',
    type: [CatalogoResponseDto],
  })
  solicitarCatalogoMall(@Query('store_id') storeId?: string): Promise<CatalogoResponseDto[]> {
    const storeIdNum = storeId ? parseInt(storeId) : undefined;
    return this.catalogoService.solicitarCatalogoMall(storeIdNum);
  }

  // ========== BARBEROS ==========
  @ApiTags('Internos - Catálogo - Barberos')
  @Post('barberos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo barbero' })
  @ApiResponse({ status: 201, description: 'Barbero creado exitosamente' })
  createBarbero(@Body() createBarberoDto: CreateBarberoDto) {
    return this.catalogoService.createBarbero(createBarberoDto);
  }

  @ApiTags('Internos - Catálogo - Barberos')
  @Get('barberos')
  @ApiOperation({ summary: 'Obtener todos los barberos' })
  @ApiQuery({ name: 'sucursalId', required: false, type: Number, description: 'Filtrar por sucursal' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean, description: 'Filtrar por estado activo' })
  @ApiResponse({ status: 200, description: 'Lista de barberos' })
  findAllBarberos(
    @Query('sucursalId') sucursalId?: string,
    @Query('activo') activo?: string,
  ) {
    const sucursalIdNum = sucursalId ? parseInt(sucursalId) : undefined;
    const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.catalogoService.findAllBarberos(sucursalIdNum, activoBool);
  }

  @ApiTags('Internos - Catálogo - Barberos')
  @Get('barberos/:id')
  @ApiOperation({ summary: 'Obtener un barbero por ID' })
  @ApiResponse({ status: 200, description: 'Barbero encontrado' })
  @ApiResponse({ status: 404, description: 'Barbero no encontrado' })
  findBarberoById(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoService.findBarberoById(id);
  }

  // ========== HORARIOS DE BARBERO ==========
  @ApiTags('Internos - Catálogo - Barberos')
  @Post('horarios/barbero')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear horario de barbero' })
  @ApiResponse({ status: 201, description: 'Horario creado exitosamente', type: HorarioBarbero })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  createHorarioBarbero(@Body() createDto: CreateHorarioBarberoDto): Promise<HorarioBarbero> {
    return this.horarioService.createHorarioBarbero(createDto);
  }

  @ApiTags('Internos - Catálogo - Barberos')
  @Get('horarios/barbero/:barberoId')
  @ApiOperation({ summary: 'Obtener horarios de un barbero' })
  @ApiParam({ name: 'barberoId', description: 'ID del barbero' })
  @ApiResponse({ status: 200, description: 'Lista de horarios', type: [HorarioBarbero] })
  getHorariosBarbero(@Param('barberoId', ParseIntPipe) barberoId: number): Promise<HorarioBarbero[]> {
    return this.horarioService.getHorariosBarbero(barberoId);
  }

  @ApiTags('Internos - Catálogo - Barberos')
  @Get('horarios/barbero/:barberoId/dia')
  @ApiOperation({
    summary: 'Obtener horario de barbero para un día específico',
    description: 'Retorna el horario considerando excepciones y horarios especiales. Usa formato de fecha: YYYY-MM-DD (ej: 2024-01-15)',
  })
  @ApiParam({ name: 'barberoId', description: 'ID del barbero', example: 1 })
  @ApiQuery({
    name: 'fecha',
    required: true,
    type: String,
    description: 'Fecha en formato YYYY-MM-DD (ej: 2024-01-15) o ISO string',
    example: '2024-01-15',
  })
  @ApiResponse({
    status: 200,
    description: 'Horario del día (puede ser null si el barbero está ausente o no tiene horario)',
    type: HorarioBarbero,
  })
  @ApiResponse({ status: 400, description: 'Fecha inválida' })
  @ApiResponse({ status: 404, description: 'Barbero no encontrado' })
  getHorarioBarberoPorDia(
    @Param('barberoId', ParseIntPipe) barberoId: number,
    @Query('fecha') fecha: string,
  ) {
    return this.horarioService.getHorarioBarberoPorDia(barberoId, fecha);
  }

  @ApiTags('Internos - Catálogo - Barberos')
  @Delete('horarios/barbero/:id')
  @ApiOperation({ summary: 'Eliminar horario de barbero' })
  @ApiParam({ name: 'id', description: 'ID del horario' })
  @ApiResponse({ status: 200, description: 'Horario eliminado' })
  deleteHorarioBarbero(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.horarioService.deleteHorarioBarbero(id);
  }

  // ========== EXCEPCIONES DE HORARIO ==========
  @ApiTags('Internos - Catálogo - Excepciones')
  @Post('horarios/excepcion')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear excepción de horario (vacaciones, cierres, horarios especiales)' })
  @ApiResponse({ status: 201, description: 'Excepción creada exitosamente', type: ExcepcionHorario })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  createExcepcion(@Body() createDto: CreateExcepcionHorarioDto): Promise<ExcepcionHorario> {
    return this.horarioService.createExcepcion(createDto);
  }

  @ApiTags('Internos - Catálogo - Excepciones')
  @Get('horarios/excepcion')
  @ApiOperation({ summary: 'Obtener excepciones de horario' })
  @ApiQuery({ name: 'sucursalId', required: false, type: Number, description: 'Filtrar por sucursal' })
  @ApiQuery({ name: 'barberoId', required: false, type: Number, description: 'Filtrar por barbero' })
  @ApiQuery({ name: 'fechaInicio', required: false, type: String, description: 'Fecha de inicio para filtrar' })
  @ApiQuery({ name: 'fechaFin', required: false, type: String, description: 'Fecha de fin para filtrar' })
  @ApiResponse({ status: 200, description: 'Lista de excepciones', type: [ExcepcionHorario] })
  getExcepciones(
    @Query('sucursalId') sucursalId?: string,
    @Query('barberoId') barberoId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): Promise<ExcepcionHorario[]> {
    const sucursalIdNum = sucursalId ? parseInt(sucursalId) : undefined;
    const barberoIdNum = barberoId ? parseInt(barberoId) : undefined;
    return this.horarioService.getExcepciones(sucursalIdNum, barberoIdNum, fechaInicio, fechaFin);
  }

  @ApiTags('Internos - Catálogo - Excepciones')
  @Delete('horarios/excepcion/:id')
  @ApiOperation({ summary: 'Eliminar excepción de horario' })
  @ApiParam({ name: 'id', description: 'ID de la excepción' })
  @ApiResponse({ status: 200, description: 'Excepción eliminada' })
  deleteExcepcion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.horarioService.deleteExcepcion(id);
  }

  // ========== PAUSAS DE BARBERO ==========
  @ApiTags('Internos - Catálogo - Barberos')
  @Post('horarios/pausa')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear pausa de barbero (descansos, comida, etc.)' })
  @ApiResponse({ status: 201, description: 'Pausa creada exitosamente', type: PausaBarbero })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  createPausa(@Body() createDto: CreatePausaBarberoDto): Promise<PausaBarbero> {
    return this.horarioService.createPausa(createDto);
  }

  @ApiTags('Internos - Catálogo - Barberos')
  @Get('horarios/pausa/barbero/:barberoId')
  @ApiOperation({ summary: 'Obtener pausas de un barbero' })
  @ApiParam({ name: 'barberoId', description: 'ID del barbero' })
  @ApiQuery({ name: 'diaSemana', required: false, type: Number, description: 'Filtrar por día de la semana (1-7)' })
  @ApiResponse({ status: 200, description: 'Lista de pausas', type: [PausaBarbero] })
  getPausasBarbero(
    @Param('barberoId', ParseIntPipe) barberoId: number,
    @Query('diaSemana') diaSemana?: string,
  ): Promise<PausaBarbero[]> {
    const diaSemanaNum = diaSemana ? parseInt(diaSemana) : undefined;
    return this.horarioService.getPausasBarbero(barberoId, diaSemanaNum);
  }

  @ApiTags('Internos - Catálogo - Barberos')
  @Delete('horarios/pausa/:id')
  @ApiOperation({ summary: 'Eliminar pausa de barbero' })
  @ApiParam({ name: 'id', description: 'ID de la pausa' })
  @ApiResponse({ status: 200, description: 'Pausa eliminada' })
  deletePausa(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.horarioService.deletePausa(id);
  }
}

