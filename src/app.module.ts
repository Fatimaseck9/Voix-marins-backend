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
      host:'jww8ogw4gk00w4w8wk8sg0kw',
      port: 3306,
      username:'mysql',
      password: '7mrsg4mJZZShSQSZTOdhqdqr8AYP6acPVZ7Y1gNCZttpBOxrQdnOi2nYB0iFVII0',
      database:'default',
      //type: 'mysql',
      //host: 'mysql.railway.internal',
      //port: 3306,
      //username: 'root',
      //password: 'YHxUZhJPgwHJqUYOekjQvFdooCBsrwux',
      //ssl: false,
      //database: 'railway',
      autoLoadEntities: true,
      synchronize: true,
      entities: [Plainte, CategoriePlainte, Marin, User, Admin],
    }),
    TypeOrmModule.forFeature([Plainte, CategoriePlainte, Marin]),
    PlaintesModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
