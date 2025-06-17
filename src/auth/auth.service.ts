import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsService } from 'src/sms/sms.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User } from 'src/users/entities/user.entity';
import { Marin } from 'src/Entity/marin.entity';
import { Admin } from 'src/Entity/admin.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Marin)
    private marinRepo: Repository<Marin>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private smsService: SmsService,
    private jwtService: JwtService,
  ) {}

  private normalizePhoneNumberForSearch(numero: string): string {
    // Supprimer tous les caractères non numériques
    numero = numero.replace(/[^\d]/g, '');
    
    // Si le numéro commence par 221, on enlève le 221
    if (numero.startsWith('221')) {
      return numero.substring(3);
    }
    
    // Si c'est un numéro à 12 chiffres (avec 221), on enlève le 221
    if (numero.length === 12 && numero.startsWith('221')) {
      return numero.substring(3);
    }
    
    // Si c'est un numéro à 9 chiffres, on le garde tel quel
    if (numero.length === 9) {
      return numero;
    }
    
    return numero;
  }

  async requestLogin(numero: string) {
    // Normaliser le numéro pour la recherche
    const normalizedNumero = this.normalizePhoneNumberForSearch(numero);
    console.log('Numéro normalisé pour la recherche:', normalizedNumero);
    
    const marin = await this.marinRepo.findOne({
      where: { numero: normalizedNumero },
      relations: ['user'],
    });

    if (!marin) {
      throw new NotFoundException('Numéro non trouvé');
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 4); // +4 minutes

    marin.codeConnexion = code;
    marin.codeConnexionExpiresAt = expiration;
    await this.marinRepo.save(marin);

    try {
      await this.smsService.sendSms(
        marin.numero, // Utiliser le numéro stocké dans la base
        `Bonjour Cher marin,\nVotre code de connexion pour la plateforme est : ${code}\nCe code expire dans 4 minutes.\n\nAgence nationale des affaires maritimes (ANAM)`,
      );
      console.log('SMS envoyé avec succès à :', marin.numero);
      console.log('Code envoyé :', code);
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'SMS:", error);
      return {
        message:
          'Le code a été généré, mais une erreur s\'est produite lors de l\'envoi de l\'SMS.',
        debug: { code: code },
      };
    }

    return {
      message: 'Code envoyé par SMS',
      debug: { code: code },
    };
  }

  async verifyCode(numero: string, code: string) {
    // Normaliser le numéro pour la recherche
    const normalizedNumero = this.normalizePhoneNumberForSearch(numero);
    console.log('Vérification - Numéro normalisé:', normalizedNumero);
    console.log('Vérification - Code reçu:', code);

    const marin = await this.marinRepo.findOne({
      where: { 
        numero: normalizedNumero,
        codeConnexion: code 
      },
      relations: ['user'],
    });

    if (!marin || !marin.user) {
      console.log('Marin non trouvé ou code invalide');
      throw new NotFoundException('Code ou numéro invalide');
    }

    const now = new Date();
    if (!marin.codeConnexionExpiresAt || marin.codeConnexionExpiresAt < now) {
      marin.codeConnexion = null;
      marin.codeConnexionExpiresAt = null;
      await this.marinRepo.save(marin);
      throw new UnauthorizedException('Code expiré');
    }

    marin.codeConnexion = null;
    marin.codeConnexionExpiresAt = null;
    await this.marinRepo.save(marin); // Nettoyage après validation

    const payload = {
      sub: marin.user.id,
      numero: marin.numero,
      name: marin.user.name,
      role: marin.user.role,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    marin.user.refreshToken = await bcrypt.hash(refresh_token, 10);
    await this.userRepository.save(marin.user);

    console.log('Connexion réussie pour:', marin.user.name);

    return {
      userId: marin.user.id,
      access_token,
      role: marin.user.role,
      refresh_token,
    };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    console.log('=== REFRESH TOKEN DEMANDÉ ===');
    console.log('User ID:', userId);
    console.log('Refresh Token reçu:', refreshToken ? 'Présent' : 'Absent');

    const marin = await this.marinRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!marin || !marin.user?.refreshToken) {
      console.log('Erreur: Utilisateur ou refresh token introuvable');
      throw new UnauthorizedException('Utilisateur ou token introuvable');
    }

    const isMatch = await bcrypt.compare(refreshToken, marin.user.refreshToken);

    if (!isMatch) {
      console.log('Erreur: Refresh token invalide');
      throw new UnauthorizedException('Token non valide');
    }

    const payload = {
      sub: marin.user.id,
      numero: marin.numero,
      role: marin.user.role,
      name: marin.user.name,
    };

    // MODIFIÉ: Durées étendues pour le renouvellement
    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: '24h', // CHANGÉ: de '1h' à '24h'
    });
    const newRefreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d', // CHANGÉ: de '7d' à '30d'
    });

    marin.user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
    await this.userRepository.save(marin.user);

    console.log('=== TOKENS RENOUVELÉS ===');
    console.log('Nouveaux tokens générés avec succès');
    console.log('Access token expire dans: 24h');
    console.log('Refresh token expire dans: 30d');
    console.log('========================');

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const admin = await this.adminRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!admin) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isOldPasswordValid = await bcrypt.compare(oldPassword, admin.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    admin.isActive = true; // Activer le compte après le changement de mot de passe

    // Sauvegarder les modifications
    await this.adminRepository.save(admin);

    return {
      status: 'success',
      message: 'Mot de passe modifié avec succès'
    };
  }

  async logout(userId: number) {
    console.log('=== DÉCONNEXION ===');
    console.log('User ID:', userId);

    const marin = await this.marinRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!marin || !marin.user) {
      console.log('Erreur: Utilisateur non trouvé pour la déconnexion');
      throw new NotFoundException('Utilisateur non trouvé');
    }

    marin.user.refreshToken = null;
    await this.userRepository.save(marin.user);

    console.log('Déconnexion réussie pour l\'utilisateur:', marin.user.name);
    console.log('==================');

    return { message: 'Déconnexion réussie' };
  }

  // NOUVELLE MÉTHODE: Vérifier la validité d'un token
  async validateToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token);
      console.log('Token valide:', decoded);
      return decoded;
    } catch (error) {
      console.log('Token invalide:', error.message);
      throw new UnauthorizedException('Token invalide');
    }
  }

  // NOUVELLE MÉTHODE: Obtenir les informations utilisateur depuis le token
  async getUserFromToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token);
      const marin = await this.marinRepo.findOne({
        where: { user: { id: decoded.sub } },
        relations: ['user'],
      });

      if (!marin || !marin.user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      return {
        id: marin.user.id,
        name: marin.user.name,
        role: marin.user.role,
        numero: marin.numero,
      };
    } catch (error) {
      throw new UnauthorizedException('Token invalide');
    }
  }

  async login(email: string, password: string) {
    const admin = await this.adminRepository.findOne({
      where: { email },
      relations: ['user'],
    });

    if (!admin || !admin.user) {
      throw new UnauthorizedException("Adresse email ou mot de passe invalide.");
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Adresse email ou mot de passe invalide.");
    }

    // Créer le payload pour le token
    const payload = {
      sub: admin.user.id,
      email: admin.email,
      role: admin.user.role,
      name: admin.user.name,
      isActive: admin.isActive
    };

    // Générer les tokens
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    // Sauvegarder le refresh token
    admin.user.refreshToken = await bcrypt.hash(refresh_token, 10);
    await this.userRepository.save(admin.user);

    // Retourner un objet JSON bien formaté
    return {
      status: 'success',
      data: {
        userId: admin.user.id,
        access_token,
        refresh_token,
        role: admin.user.role,
        name: admin.user.name,
        email: admin.email,
        isActive: admin.isActive
      }
    };
  }
}