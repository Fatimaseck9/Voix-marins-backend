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
import { diskStorage } from 'multer';
import { PlaintesService } from './plainte.service';
import { CreatePlainteDto } from 'src/DTO/create-plainte.dto';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RoleGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/users/entities/role.enum';
import { CreatePlainteByAdminDto } from 'src/DTO/create-plainte-by-admin.dto';

@UseGuards(JwtAuthGuard)
@Controller('plaintes')
export class PlaintesController {
  private readonly logger = new Logger(PlaintesController.name);

  constructor(private readonly plaintesService: PlaintesService) {}

  @Post('create')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `plainte-${uniqueSuffix}${ext}`);
        },
      }),
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
  async create(
    @Body() dto: any,
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: any,
  ) {
    // Logs de diagnostic pour l'authentification
    this.logger.log('=== DEBUT create ===');
    this.logger.log('Headers reçus:', req.headers);
    this.logger.log('Authorization header:', req.headers.authorization);
    this.logger.log('User object:', req.user);
    this.logger.log('Body reçu:', dto);
    this.logger.log('File reçu:', file);

    const utilisateurId = req.user?.sub;

    this.logger.log('UtilisateurId extrait:', utilisateurId);

    if (!utilisateurId) {
      this.logger.error('Utilisateur non authentifié - req.user:', req.user);
      throw new BadRequestException('Utilisateur non authentifié');
    }

    // Validation manuelle des champs requis
    if (!dto.titre || !dto.categorie || !dto.description) {
      throw new BadRequestException('Titre, catégorie et description sont requis');
    }

    // Sauvegarde directe du fichier sans conversion
    const audioUrl = file ? `/uploads/${file.filename}` : undefined;

    const plainteData: any = {
      ...dto,
      audioUrl,
      utilisateurId,
      date: file ? new Date().toISOString().split('T')[0] : dto.date,
    };

    this.logger.log('Données à sauvegarder:', plainteData);

    try {
      const result = await this.plaintesService.create(plainteData);
      this.logger.log('Plainte créée avec succès:', result);
      return result;
    } catch (error) {
      this.logger.error('Erreur lors de la création de la plainte:', error);
      throw error;
    }
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
    storage: diskStorage({
      destination: './uploads/pv',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `pv-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      // Vérifier le type de fichier
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

@Get('test-static')
async testStaticFiles() {
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  try {
    const exists = fs.existsSync(uploadsDir);
    const files = exists ? fs.readdirSync(uploadsDir) : [];
    
    return {
      message: 'Test des fichiers statiques',
      uploadsDir,
      dirExists: exists,
      fileCount: files.length,
      sampleFiles: files.slice(0, 5), // Premiers 5 fichiers
      cwd: process.cwd()
    };
  } catch (error) {
    return {
      error: 'Erreur lors du test',
      details: error.message,
      cwd: process.cwd()
    };
  }
}

@Get('debug/files')
async listUploadedFiles() {
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  try {
    const files = fs.readdirSync(uploadsDir);
    return {
      message: 'Fichiers dans le dossier uploads',
      files: files.filter(file => file.startsWith('plainte-')),
      totalFiles: files.length
    };
  } catch (error) {
    return {
      error: 'Erreur lors de la lecture du dossier uploads',
      details: error.message
    };
  }
}

@Post('create-by-admin')
@UseInterceptors(
  FileInterceptor('audio', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `plainte-${uniqueSuffix}${ext}`);
      },
    }),
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
async createByAdmin(
  @Body(new ValidationPipe()) dto: CreatePlainteByAdminDto,
  @UploadedFile() file?: Express.Multer.File,
  @Req() req?: any,
) {
  this.logger.log('Body reçu (admin):', dto);
  if (!dto.marinId) {
    throw new BadRequestException('marinId est requis');
  }

  // Sauvegarde directe du fichier sans conversion
  const audioUrl = file ? `/uploads/${file.filename}` : undefined;

  const plainteData: any = {
    ...dto,
    audioUrl,
    date: file ? new Date().toISOString().split('T')[0] : dto['date'],
    marinId: dto.marinId,
  };
  return this.plaintesService.createByAdmin(plainteData);
}

}