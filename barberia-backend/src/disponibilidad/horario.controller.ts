import { Controller } from '@nestjs/common';

@Controller('horarios')
export class HorarioController {
  // Los endpoints de horarios se han movido al CatalogoController
  // para que aparezcan junto a sus entidades relacionadas en Swagger
}
