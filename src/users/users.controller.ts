import { Controller, Post, Body, Get, Delete, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './users.service';
import { CreateAdminDto } from 'src/DTO/create-admin.dto';
import { User } from './entities/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

   @Post('admin')
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.userService.createAdminUser(createAdminDto);
  }


  @Get('admins')
  async findAdmins() {
    const admins = await this.userService.findAdmins();
    return {
      success: true,
      data: admins,
      count: admins.length
    };
  }

@Delete(':id')
deleteAdmin(@Param('id') id: number) {
  return this.userService.deleteAdmin(+id);
}

@Patch(':id/toggle')
toggleAdminStatus(@Param('id') id: number) {
  return this.userService.toggleActivation(+id);
}

@Patch(':id')
updateAdmin(@Param('id') id: number, @Body() data: Partial<User>) {
  return this.userService.updateAdmin(+id, data);
}

  
}
