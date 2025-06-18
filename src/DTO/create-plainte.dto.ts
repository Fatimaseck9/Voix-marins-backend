import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  Matches,
  MinLength,
  MaxLength,
  IsInt,
} from 'class-validator';

export class CreatePlainteDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Le titre doit contenir au moins 3 caractères' })
  @MaxLength(100, { message: 'Le titre ne doit pas dépasser 100 caractères' })
  titre: string;

  @IsNotEmpty()
  @IsString()
  categorie: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10, {
    message: 'La description doit contenir au moins 10 caractères',
  })
  @MaxLength(1000, {
    message: 'La description ne doit pas dépasser 1000 caractères',
  })
  description: string;

  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La date doit être au format YYYY-MM-DD',
  })
  date?: string;


   @IsNotEmpty()
  @IsInt({ message: 'L\'ID utilisateur doit être un entier' })
  utilisateurId: number;

  //@IsOptional()
  //@IsString()
 // audioUrl?: string;

  //@IsOptional()
  //@IsString()
 // utilisateurId?: string;


  
}
