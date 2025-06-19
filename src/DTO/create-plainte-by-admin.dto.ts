import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreatePlainteByAdminDto {
  @IsNotEmpty()
  @IsInt()
  marinId: number;

  @IsNotEmpty()
  @IsString()
  titre: string;

  @IsNotEmpty()
  @IsString()
  categorie: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  date: string;

  // Ajoute d'autres champs si besoin (date, audioUrl, etc.)
} 