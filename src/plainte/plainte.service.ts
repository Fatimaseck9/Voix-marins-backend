import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plainte } from 'src/Entity/plainte.entity';
import { Repository } from 'typeorm';
import { CreatePlainteDto } from 'src/DTO/create-plainte.dto';
import { Marin } from 'src/Entity/marin.entity';
import { CategoriePlainte } from 'src/Entity/categorie.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PlaintesService {
  private readonly defaultCategories = [
    { key: 'harcelement', label: 'Harcèlement', image: 'harcelement.jpeg' },
    { key: 'violence', label: 'Violence physique', image: 'violence.jpeg' },
    { key: 'nourriture', label: 'Refus de nourriture', image: 'nourriture.jpeg' },
    { key: 'paiement', label: 'Problème de paiement', image: 'paiement.jpeg' },
  ];

  constructor(
    @InjectRepository(Plainte)
    private readonly plainteRepository: Repository<Plainte>,
    @InjectRepository(Marin)
    private readonly marinRepository: Repository<Marin>,
    @InjectRepository(CategoriePlainte)
    private readonly categorieRepository: Repository<CategoriePlainte>,
  ) {
    void this.initializeCategories();
  }

  private async initializeCategories() {
    for (const cat of this.defaultCategories) {
      const existing = await this.categorieRepository.findOne({
        where: { key: cat.key },
      });
      if (!existing) {
        await this.categorieRepository.save(cat);
      }
    }
  }

  async getCategories() {
    return this.categorieRepository.find({
      order: { label: 'ASC' },
    });
  }

  async getCategorieByKey(key: string) {
    return this.categorieRepository.findOne({
      where: { key },
    });
  }

  async create( 
  createPlainteDto: CreatePlainteDto & { utilisateurId: number },
): Promise<Plainte> {
  console.log('Données reçues pour création de plainte:', createPlainteDto);

  const marin = await this.marinRepository.findOne({
    where: { user: { id: createPlainteDto.utilisateurId } },
    relations: ['user'],
  });

  if (!marin) {
    throw new NotFoundException(
      `Marin lié à l'utilisateur ID '${createPlainteDto.utilisateurId}' introuvable`,
    );
  }

  const plainte = this.plainteRepository.create({
    ...createPlainteDto,
    utilisateur: marin,
    statut: 'En attente',
  });

  console.log('Plainte créée:', plainte);

  return this.plainteRepository.save(plainte);
}

  findAll(): Promise<Plainte[]> {
    return this.plainteRepository.find({
      relations: ['utilisateur', 'utilisateur.user'],
      order: {
        dateCreation: 'DESC',
      },
    });
  }

  async findByUserId(userId: number): Promise<Plainte[]> {
  return this.plainteRepository.find({
    where: { utilisateur: { user: { id: userId } } },
    relations: ['utilisateur', 'utilisateur.user'],
    order: {
      dateCreation: 'DESC',
    },
  });
}

  async update(id: string, data: Partial<Plainte>): Promise<void> {
    const result = await this.plainteRepository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException('Plainte non trouvée');
    }
  }

  async findOne(id: number): Promise<Plainte> {
    const plainte = await this.plainteRepository.findOne({
      where: { id },
      relations: ['utilisateur', 'utilisateur.user'],
    });

    if (!plainte) {
      throw new NotFoundException('Plainte non trouvée');
    }

    return plainte;
  }

  async remove(id: string): Promise<void> {
    const result = await this.plainteRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Plainte non trouvée');
    }
  }

  deleteAudioFile(audioUrl: string): void {
    try {
      const filePath = path.join(process.cwd(), audioUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier audio:', error);
    }
  }

  async findById(id: number) {
    return this.plainteRepository.findOne({
      where: { id },
    });
  }

  //async updateStatut(id: number, statut: string): Promise<Plainte> {
 // const plainte = await this.plainteRepository.findOne({ where: { id } });
  //if (!plainte) {
    //throw new NotFoundException('Plainte non trouvée');
 // }

  //plainte.statut = statut;
  //return this.plainteRepository.save(plainte);
//}

async updatePlainte(id: number, updateData: Partial<{ statut: string; categorie: string; detailsplainte: string }>) {
  const plainte = await this.findOne(id);
  if (!plainte) {
    throw new NotFoundException('Plainte non trouvée');
  }
  // Mise à jour des champs
  plainte.statut = updateData.statut ?? plainte.statut;
  plainte.categorie = updateData.categorie ?? plainte.categorie;
  plainte.detailsplainte = updateData.detailsplainte?? plainte.detailsplainte;

  return this.plainteRepository.save(plainte);
}


}
