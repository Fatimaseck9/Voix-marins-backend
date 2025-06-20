// jwt-auth.guard.ts
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    this.logger.log('=== JWT Guard canActivate ===');
    this.logger.log('URL:', request.url);
    this.logger.log('Method:', request.method);
    this.logger.log('Authorization header:', request.headers.authorization);
    this.logger.log('All headers:', request.headers);
    
    // Appeler d'abord la logique parente
    const parentResult = await super.canActivate(context);
    
    // Ensuite accéder à la requête
    this.logger.log('Token payload:', request.user);
    this.logger.log('Parent result:', parentResult);
    
    return parentResult as boolean;
  }
}