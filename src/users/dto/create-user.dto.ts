import { Role } from "../entities/role.enum";

export class CreateUserDto {
  name: string;
  role: Role; // 'MARIN' ou 'ADMIN'
  marinData?: {
    numero: string;
    numeroIdentification: string;
    codeConnexion?: string;
  };


   // Champs spécifiques à l'admin
  //email?: string;
  //passwordHash?: string;

}
