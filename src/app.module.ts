import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plainte } from './Entity/plainte.entity';
import { CategoriePlainte } from './Entity/categorie.entity';
import { Marin } from './Entity/marin.entity';
import { PlaintesModule } from './plainte/plainte.module';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
 
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'jww8ogw4gk00w4w8wk8sg0kw',
      port: 3306,
      username: 'mysql',
      password: '7mrsg4mJZZShSQSZTOdhqdqr8AYP6acPVZ7Y1gNCZttpBOxrQdnOi2nYB0iFVII0',
      database: 'default',
      autoLoadEntities: true,
      synchronize: true,
      entities: [Plainte, CategoriePlainte, Marin, User],
    }),
    TypeOrmModule.forFeature([Plainte, CategoriePlainte, Marin]),
    PlaintesModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}