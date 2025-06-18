import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaintesService } from './plainte.service';
import { PlaintesController } from './plainte.controller';
import { Plainte } from 'src/Entity/plainte.entity';
import { Marin } from 'src/Entity/marin.entity';
import { CategoriePlainte } from 'src/Entity/categorie.entity';
import { User } from 'src/users/entities/user.entity';
import { Admin } from 'src/Entity/admin.entity';
import { UsersModule } from 'src/users/users.module';
import { CloudinaryService } from '../Emailservice/cloudinary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plainte, Marin, CategoriePlainte, User, Admin]),
    UsersModule
  ],
  controllers: [PlaintesController],
  providers: [PlaintesService, CloudinaryService],
  exports: [PlaintesService]
})
export class PlaintesModule {}
