import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Marin } from 'src/Entity/marin.entity';
import { CreateMarinDto } from 'src/DTO/create-marin.dto';
import { RegisterMarinDto } from 'src/users/dto/register-marin.dto';
import { Role } from 'src/users/entities/role.enum';
;

@Injectable()
export class MarinService {
  constructor(
    @InjectRepository(Marin)
    private marinRepo: Repository<Marin>,
    
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateMarinDto): Promise<Marin> {
    const user = await this.userRepo.findOneBy({ id: dto.userId });
    if (!user) throw new Error('Utilisateur introuvable');

    const marin = this.marinRepo.create({
      numero: dto.numero,
      numeroIdentification: dto.numeroIdentification,
      user,
    });

    return this.marinRepo.save(marin);
  }

 async registerMarin(dto: RegisterMarinDto): Promise<Marin> {
    try {
      // Créer l'utilisateur
      const user = this.userRepo.create({
        name: dto.name,
        role: Role.MARIN
      });
      const savedUser = await this.userRepo.save(user);

      // Créer le marin
      const marin = this.marinRepo.create({
        numero: dto.numero,
        numeroIdentification: dto.numero,
        user: savedUser
      });

      return await this.marinRepo.save(marin);
    } catch (error) {
      console.error('Erreur lors de l\'inscription du marin:', error);
      throw new InternalServerErrorException(
        `Erreur lors de l'inscription du marin: ${error.message}`
      );
    }
  }

  async findAll(): Promise<any[]> {
    const marins = await this.marinRepo.find({ relations: ['user'] });
    return marins.map(marin => ({
      id: marin.id,
      numero: marin.numero,
      user: marin.user ? {
        id: marin.user.id,
        name: marin.user.name
      } : null
    }));
  }
}
