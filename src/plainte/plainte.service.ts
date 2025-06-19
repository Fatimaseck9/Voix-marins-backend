import { Injectable, NotFoundException, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plainte } from 'src/Entity/plainte.entity';
import { Repository } from 'typeorm';
import { CreatePlainteDto } from 'src/DTO/create-plainte.dto';
import { Marin } from 'src/Entity/marin.entity';
import { CategoriePlainte } from 'src/Entity/categorie.entity';
import * as fs from 'fs';
import * as path from 'path';
import { User } from 'src/users/entities/user.entity';
import { Admin } from 'src/Entity/admin.entity';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {
    void this.initializeCategories();
    void this.updateOldStatuses();
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

  private async updateOldStatuses() {
    try {
      // Mettre à jour les anciens statuts
      await this.plainteRepository
        .createQueryBuilder()
        .update(Plainte)
        .set({ statut: 'En traitement' })
        .where('statut = :oldStatus', { oldStatus: 'Traitée' })
        .execute();

      await this.plainteRepository
        .createQueryBuilder()
        .update(Plainte)
        .set({ statut: 'Resolue' })
        .where('statut = :oldStatus', { oldStatus: 'Rejetée' })
        .execute();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statuts:', error);
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

  async create(createPlainteDto: any): Promise<Plainte> {
    let marin = null;

    if (createPlainteDto.marinId) {
      marin = await this.marinRepository.findOne({
        where: { id: createPlainteDto.marinId },
        relations: ['user'],
      });
    } else if (createPlainteDto.utilisateurId) {
      marin = await this.marinRepository.findOne({
        where: { user: { id: createPlainteDto.utilisateurId } },
        relations: ['user'],
      });
    }

    if (!marin) {
      throw new NotFoundException(
        `Marin introuvable pour l'ID fourni`
      );
    }

    const plainte = this.plainteRepository.create({
      ...createPlainteDto,
      utilisateur: marin,
      statut: 'En attente',
    });

    return this.plainteRepository.save(plainte);
  }

  findAll(): Promise<Plainte[]> {
    try {
      return this.plainteRepository.find({
        relations: ['utilisateur', 'utilisateur.user'],
        order: {
          dateCreation: 'DESC',
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des plaintes:', error);
      throw new HttpException(
        'Erreur lors de la récupération des plaintes',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
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

async updatePlainte(id: number, updateData: Partial<{ 
  statut: string;
  categorie: string; 
  detailsplainte: string;
  pvUrl: string;
  resolvedBy: number;
}>) {
  const plainte = await this.findOne(id);
  if (!plainte) {
    throw new NotFoundException('Plainte non trouvée');
  }

  // Mise à jour des champs
  plainte.statut = updateData.statut ?? plainte.statut;
  plainte.categorie = updateData.categorie ?? plainte.categorie;
  plainte.detailsplainte = updateData.detailsplainte ?? plainte.detailsplainte;
  plainte.pvUrl = updateData.pvUrl ?? plainte.pvUrl;

  // Si le statut est "Resolue", mettre à jour resolvedBy et dateResolution
  if (updateData.statut === 'Resolue' && updateData.resolvedBy) {
    plainte.resolvedBy = updateData.resolvedBy;
    plainte.dateResolution = new Date();
  }

  return this.plainteRepository.save(plainte);
}

async uploadPV(plainteId: number, file: Express.Multer.File): Promise<Plainte> {
  const plainte = await this.findOne(plainteId);
  if (!plainte) {
    throw new NotFoundException('Plainte non trouvée');
  }

  // Supprimer l'ancien PV s'il existe
  if (plainte.pvUrl) {
    try {
      const oldFilePath = path.join(process.cwd(), plainte.pvUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'ancien PV:', error);
    }
  }

  // Mettre à jour l'URL du PV
  plainte.pvUrl = `/uploads/pv/${file.filename}`;
  return this.plainteRepository.save(plainte);
}

async deletePV(plainteId: number): Promise<Plainte> {
  const plainte = await this.findOne(plainteId);
  if (!plainte) {
    throw new NotFoundException('Plainte non trouvée');
  }

  // Supprimer le fichier PV s'il existe
  if (plainte.pvUrl) {
    try {
      const filePath = path.join(process.cwd(), plainte.pvUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier PV:', error);
    }
  }

  // Mettre à jour la plainte
  plainte.pvUrl = '';
  return this.plainteRepository.save(plainte);
}

async findPlaintesResolues(): Promise<Plainte[]> {
  return this.plainteRepository.find({
    where: { statut: 'Resolue' },
    relations: ['utilisateur', 'utilisateur.user'],
    order: {
      dateResolution: 'DESC'
    }
  });
}

async getAdminInfo(id: number) {
  const user = await this.userRepository.findOne({
    where: { id },
    relations: ['admin'],
  });

  if (!user || !user.admin) {
    throw new NotFoundException('Administrateur non trouvé');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.admin.email
  };
}

}
