import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plainte } from './Entity/plainte.entity';
import { CategoriePlainte } from './Entity/categorie.entity';
import { Marin } from './Entity/marin.entity';
import { PlaintesModule } from './plainte/plainte.module';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import { Admin } from 'typeorm';




@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      ssl: false,
      database: 'GestionMarin',
      autoLoadEntities: true, 
     // synchronize: true, 
      entities: [Plainte, CategoriePlainte, Marin,User,Admin],
     
    }),
    TypeOrmModule.forFeature([Plainte, CategoriePlainte, Marin]),
    PlaintesModule,AuthModule,UsersModule,
  ],
})
export class AppModule {}
