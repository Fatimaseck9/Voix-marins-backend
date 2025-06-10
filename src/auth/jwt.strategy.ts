import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'gestion_connexion',
    });
  }

  async validate(payload: any) {
    console.log('Payload reçu:', payload);
    // Vérifier que les informations essentielles sont présentes dans le payload
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token invalide : informations manquantes');
    }

    // Optionnel: vérifier si l'utilisateur existe toujours dans la base de données
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    // Retourner les informations utilisateur qui seront attachées à la requête
    return { 
      sub: payload.sub,
      numero: payload.numero,
      role: payload.role || user.role,
      name: payload.name || user.name
    };
  }
}