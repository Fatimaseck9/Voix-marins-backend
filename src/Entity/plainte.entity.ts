import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Marin } from './marin.entity';
import { CategoriePlainte } from './categorie.entity';


@Entity()
export class Plainte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titre: string;

  @Column()
  categorie: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true })
  audioUrl: string;

  @Column({
    type: 'varchar',
    nullable: true,
    default: null
  })
  pvUrl: string | null;

  @Column({
    type: 'enum',
    enum: ['En attente', 'En traitement', 'Resolue'],
    default: 'En attente',
  })
  statut: string;

  @Column({ type: 'int', nullable: true })
  resolvedBy: number | null;

  @Column({ type: 'datetime', nullable: true })
  dateResolution: Date | null;

  @ManyToOne(() => Marin, (marin) => marin.plaintes)
  utilisateur: Marin;

  @ManyToOne(() => CategoriePlainte, (categorie) => categorie.plaintes)
  categoriePlainte: CategoriePlainte;

  @CreateDateColumn()
  dateCreation: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ type: 'text', nullable: true })
  detailsplainte: string;
}