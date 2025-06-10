import { Controller, Post, Body } from '@nestjs/common';
import { MarinService } from './marin.service';
import { CreateMarinDto } from 'src/DTO/create-marin.dto';


@Controller('marins')
export class MarinController {
  constructor(private readonly marinService: MarinService) {}

  @Post()
  async create(@Body() createMarinDto: CreateMarinDto) {
    return this.marinService.create(createMarinDto);
  }
}
