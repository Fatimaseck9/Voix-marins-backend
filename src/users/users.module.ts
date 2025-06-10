import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MarinModule } from 'src/marin/marin.module';
import { Marin } from 'src/Entity/marin.entity';
import { Admin } from 'src/Entity/admin.entity';




@Module({
  imports: [
    TypeOrmModule.forFeature([User,Admin]),
    MarinModule 
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
