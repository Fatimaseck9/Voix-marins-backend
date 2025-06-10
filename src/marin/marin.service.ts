import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Marin } from 'src/Entity/marin.entity';
import { CreateMarinDto } from 'src/DTO/create-marin.dto';
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
}
