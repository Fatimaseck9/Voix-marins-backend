import { Module } from '@nestjs/common';
import { MarinService } from './marin.service';
import { MarinController } from './marin.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Marin } from 'src/Entity/marin.entity';

@Module({
 imports: [TypeOrmModule.forFeature([Marin,User])],
  controllers: [MarinController],
  providers: [MarinService],
   exports: [MarinService],
})
export class MarinModule {}
