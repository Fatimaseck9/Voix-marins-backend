import { Controller, Post, Body, Get } from '@nestjs/common';
import { MarinService } from './marin.service';
import { CreateMarinDto } from 'src/DTO/create-marin.dto';
import { RegisterMarinDto } from 'src/users/dto/register-marin.dto';
import { Marin } from 'src/Entity/marin.entity';


@Controller('marins')
export class MarinController {
  constructor(private readonly marinService: MarinService) {}

  @Post()
  async create(@Body() createMarinDto: CreateMarinDto) {
    return this.marinService.create(createMarinDto);
  }

   @Post('register')
  async registerMarin(@Body() registerMarinDto: RegisterMarinDto): Promise<Marin> {
    return this.marinService.registerMarin(registerMarinDto);
  }

  @Get()
  async findAll() {
    return this.marinService.findAll();
  }
}
