import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-login')
  async requestLogin(@Body('numero') numero: string) {
    numero = numero.replace(/[^\d+]/g, '');
    return this.authService.requestLogin(numero);
  }

  @Post('verify-code')
  async verifyCode(@Body() body: { numero: string; code: string }) {
    const { numero, code } = body;
    const normalizedNumero = numero.replace(/[^\d+]/g, '');
    return this.authService.verifyCode(normalizedNumero, code);
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: { userId: number; refreshToken: string }) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    const result = await this.authService.login(email, password);
    return {
      success: true,
      data: result.data
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() body: { userId: number; oldPassword: string; newPassword: string }
  ) {
    return this.authService.changePassword(body.userId, body.oldPassword, body.newPassword);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Body('userId') userId: number) {
    return this.authService.logout(userId);
  }
}
