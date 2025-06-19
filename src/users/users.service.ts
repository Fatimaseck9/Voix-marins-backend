import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Role } from './entities/role.enum';
import { CreateAdminDto } from 'src/DTO/create-admin.dto';
import { Admin } from 'src/Entity/admin.entity'; // ajuste le chemin si besoin
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
     @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
  ) {}

  create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepo.create(createUserDto);
    return this.userRepo.save(user);
  }

  findAll(): Promise<User[]> {
    return this.userRepo.find({ relations: ['marin','admin'] });
  }

  async updateLastLogin(id: number, updateData: { lastLogin: Date }): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    Object.assign(user, updateData);
    return this.userRepo.save(user);
  }

  async createAdminUser(adminDto: CreateAdminDto): Promise<User> {
    const { email, password, name } = adminDto;

    if (!email || !password) {
      throw new BadRequestException("Email et mot de passe requis pour un administrateur");
    }

    // Vérifier si l'email existe déjà
    const existingAdmin = await this.adminRepo.findOne({ where: { email } });
    if (existingAdmin) {
      throw new BadRequestException("Un administrateur avec cet email existe déjà");
    }

    try {
      // Créer l'utilisateur
      const user = this.userRepo.create({
        name,
        role: Role.ADMIN,
      });

      // Sauvegarder l'utilisateur
      const savedUser = await this.userRepo.save(user);

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'admin
      const admin = this.adminRepo.create({
        email,
        password: hashedPassword,
        user: savedUser,
        isActive: false
      });

      // Sauvegarder l'admin
      await this.adminRepo.save(admin);

      // Retourner l'utilisateur avec la relation admin
      const userWithAdmin = await this.userRepo.findOne({
        where: { id: savedUser.id },
        relations: ['admin']
      });

      if (!userWithAdmin) {
        throw new BadRequestException("Erreur lors de la récupération des données de l'administrateur");
      }

      return userWithAdmin;
    } catch (error) {
      // En cas d'erreur, supprimer l'utilisateur si déjà créé
      throw new BadRequestException("Erreur lors de la création de l'administrateur: " + error.message);
    }
  }

  async findAdmins(): Promise<any[]> {
    const admins = await this.userRepo.find({
      where: { role: Role.ADMIN },
      relations: ['admin'],
    });

    // Retourner les données sans le mot de passe
    return admins.map(admin => ({
      id: admin.id,
      name: admin.name,
      role: admin.role,
      admin: admin.admin ? {
        id: admin.admin.id,
        email: admin.admin.email,
        isActive: admin.admin.isActive
      } : null
    }));
  }

  async deleteAdmin(id: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['admin'] });
    if (!user) throw new NotFoundException("Utilisateur non trouvé");

    // Supprimer d'abord l'entité Admin liée
    if (user.admin) {
      await this.adminRepo.remove(user.admin);
    }

    await this.userRepo.remove(user);
  }

  async toggleActivation(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['admin'] });
    if (!user || !user.admin) {
      throw new NotFoundException('Administrateur non trouvé');
    }

    user.admin.isActive = !user.admin.isActive;
    await this.adminRepo.save(user.admin);
    return user;
  }

  async updateAdmin(id: number, updateData: Partial<User>): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("Utilisateur non trouvé");

    Object.assign(user, updateData);
    return this.userRepo.save(user);
  }
}
