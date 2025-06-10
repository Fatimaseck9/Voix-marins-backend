import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Plainte } from './plainte.entity';

@Entity()
export class CategoriePlainte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  label: string;

  @Column()
  image: string;

  @OneToMany(() => Plainte, (plainte) => plainte.categoriePlainte)
  plaintes: Plainte[];
}
