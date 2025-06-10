import { Controller, Get, Post, Body, Param, ParseIntPipe, NotFoundException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriePlainte } from '../Entity/categorie.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('categories')
export class CategorieController {
  constructor(
    @InjectRepository(CategoriePlainte)
    private categorieRepository: Repository<CategoriePlainte>,
  ) {}

  @Get()
//@UseGuards(JwtAuthGuard)
  async findAll() {
    return this.categorieRepository.find({
      order: {
        label: 'ASC',
      },
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const categorie = await this.categorieRepository.findOne({
      where: { id },
      relations: ['plaintes'],
    });
    
    if (!categorie) {
      throw new NotFoundException('Catégorie non trouvée');
    }
    
    return categorie;
  }

  @Post()
  async create(@Body() categorie: Partial<CategoriePlainte>) {
    const newCategorie = this.categorieRepository.create(categorie);
    return this.categorieRepository.save(newCategorie);
  }
} 