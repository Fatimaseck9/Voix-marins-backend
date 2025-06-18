import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
  Delete,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UseGuards,
  Logger,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlaintesService } from './plainte.service';
import { CreatePlainteDto } from 'src/DTO/create-plainte.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RoleGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/users/entities/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('plaintes')
export class PlaintesController {
  private readonly logger = new Logger(PlaintesController.name);

  constructor(private readonly plaintesService: PlaintesService) {}

  @Post('create')
  @UseInterceptors(
    FileInterceptor('audio', {
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/audio\/(webm|mpeg|wav)/)) {
          return cb(
            new BadRequestException(
              'Type de fichier audio non supporté. Formats acceptés : webm, mpeg, wav',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @Post('create')
@UseInterceptors(FileInterceptor('audio', {
  fileFilter: (req, file, cb) => {
    console.log('TYPE MIME reçu :', file.mimetype);
    if (!file.mimetype.match(/(audio|video)\/(webm|mpeg|wav)/)) {
      return cb(new BadRequestException(
        'Type de fichier audio non supporté. Formats acceptés : webm, mpeg, wav'
      ), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
}))
async create(
  @UploadedFile() file: Express.Multer.File,
  @Body(new ValidationPipe({ transform: true })) dto: CreatePlainteDto,
  @Req() req: any,
) {
  const utilisateurId = req.user?.sub;
  if (!utilisateurId) {
    throw new BadRequestException('Utilisateur non authentifié');
  }

  let audioUrl: string | undefined = undefined;

  if (file) {
    audioUrl = await this.plaintesService.uploadFileToLaravel(file, 'audio');
  }

  const plainteData: any = {
    ...dto,
    audioUrl,
    utilisateurId,
    date: file ? new Date().toISOString().split('T')[0] : dto.date,
  };

  return this.plaintesService.create(plainteData);
}

  @Post('form')
  async submitForm(
    @Body(new ValidationPipe()) dto: CreatePlainteDto,
    @Req() req?: any,
  ) {
    // AJOUT: Logs pour déboguer
    this.logger.log('=== DEBUT submitForm ===');
    this.logger.log('Headers reçus:', req.headers);
    this.logger.log('Body reçu:', dto);
    this.logger.log('User from token:', req.user);

    try {
      // Validation de la catégorie
      const categorie = await this.plaintesService.getCategorieByKey(dto.categorie);
      if (!categorie) {
        throw new BadRequestException(`Catégorie '${dto.categorie}' non valide`);
      }

      const utilisateurId = req.user?.sub;
      if (!utilisateurId) {
        throw new BadRequestException('Utilisateur non authentifié');
      }

      // CORRECTION: Typage explicite pour éviter les erreurs TypeScript
      const plainteData: any = {
        ...dto,
        audioUrl: undefined,
        utilisateurId,
        date: dto.date ?? new Date().toISOString().split('T')[0],
      };

      this.logger.log('Données à sauvegarder:', plainteData);
      const result = await this.plaintesService.create(plainteData);
      this.logger.log('Plainte créée avec succès:', result);
      
      return result;

    } catch (error) {
      this.logger.error('Erreur dans submitForm:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Gestion des erreurs de validation
      if (error.message && Array.isArray(error.message)) {
        throw new BadRequestException({
          message: 'Erreurs de validation',
          errors: error.message
        });
      }
      
      throw new HttpException(
        `Erreur lors de la création de la plainte: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('categorie/:categorieKey')
  async createFromCategorie(
    @Param('categorieKey') categorieKey: string,
    @Req() req?: any,
  ) {
    const categorie = await this.plaintesService.getCategorieByKey(categorieKey);
    if (!categorie) {
      throw new BadRequestException('Catégorie non trouvée');
    }

    // CORRECTION: Utiliser req.user?.sub au lieu de req.user?.id
    const utilisateurId = req?.user?.sub;
    if (!utilisateurId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    // CORRECTION: Typage explicite pour éviter les erreurs TypeScript
    const plainteData: any = {
      titre: `Plainte ${categorie.label}`,
      categorie: categorieKey,
      description: 'Soumise via catégorie',
      date: new Date().toISOString().split('T')[0],
      utilisateurId,
    };

    return this.plaintesService.create(plainteData);
  }


  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.plaintesService.findAll();
  }

  //@Get()
  //findAll() {
    //return this.plaintesService.findAll();
 // }

@Get('user/:id')
async findByUserId(@Param('id') id: number) {
  return this.plaintesService.findByUserId(+id);
}


  @Get('categories')
  getCategories() {
    return this.plaintesService.getCategories();
  }

  @Delete(':id')
  async removePlainte(@Param('id') id: number, @Req() req?: any) {
    const username = req?.user?.name;

    const plainte = await this.plaintesService.findOne(id);
    if (!plainte) {
      throw new HttpException('Plainte non trouvée', HttpStatus.NOT_FOUND);
    }

    const plainteUser =
      typeof plainte.utilisateur === 'object' && plainte.utilisateur.user
        ? plainte.utilisateur.user.name
        : plainte.utilisateur;

    if (plainteUser !== username) {
      throw new HttpException(
        'Vous ne pouvez supprimer que vos propres plaintes',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.plaintesService.remove(id.toString());
  }


 // @Put(':id/statut')
//async updateStatut(@Param('id') id: number, @Body('statut') statut: string) {
  //return this.plaintesService.updateStatut(id, statut);
//}
@Put(':id')
async updatePlainte(
  @Param('id') id: number,
  @Body() updateData: { 
    statut?: string; 
    categorie?: string; 
    detailsplainte?: string;
    pvUrl?: string;
    resolvedBy?: number;
  },
  @Req() req: any
) {
  // Si le statut est "Resolue", utiliser l'ID de l'admin
  if (updateData.statut === 'Resolue') {
    if (!req.user || !req.user.sub) {
      throw new BadRequestException('Informations administrateur manquantes');
    }
    updateData.resolvedBy = req.user.sub;
  }

  return this.plaintesService.updatePlainte(id, updateData);
}



@Post(':id/pv')
@UseInterceptors(
  FileInterceptor('file', {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
        return cb(
          new BadRequestException(
            'Type de fichier non supporté. Formats acceptés : PDF, DOC, DOCX',
          ),
          false,
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
  }),
)
async uploadPV(
  @Param('id') plainteId: number,
  @UploadedFile() file: Express.Multer.File,
) {
  if (!file) {
    throw new BadRequestException('Aucun fichier n\'a été uploadé');
  }
  return this.plaintesService.uploadPV(plainteId, file);
}

@Delete(':id/pv')
@UseGuards(JwtAuthGuard)
async deletePV(@Param('id') plainteId: number) {
  return this.plaintesService.deletePV(plainteId);
}

@Get('resolues')
async getPlaintesResolues() {
  return this.plaintesService.findPlaintesResolues();
}

@Get('admin/:id')
async getAdminInfo(@Param('id') id: number) {
  return this.plaintesService.getAdminInfo(id);
}

}