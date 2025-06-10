import { Module } from '@nestjs/common';
import { PlaintesController } from './plainte.controller';
import { PlaintesService } from './plainte.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plainte } from '../Entity/plainte.entity';
import { CategoriePlainte } from '../Entity/categorie.entity';
import { Marin } from '../Entity/marin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plainte, CategoriePlainte, Marin])
  ],
  controllers: [PlaintesController],
  providers: [PlaintesService]
})
export class PlaintesModule {}
