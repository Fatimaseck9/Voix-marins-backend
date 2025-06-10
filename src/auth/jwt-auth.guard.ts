// jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Appeler d'abord la logique parente
    const parentResult = await super.canActivate(context);
    
    // Ensuite accéder à la requête
    const request = context.switchToHttp().getRequest();
    console.log('Token payload:', request.user);
    
    return parentResult as boolean;
  }
}