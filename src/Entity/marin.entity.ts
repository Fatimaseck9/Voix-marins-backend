import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Plainte } from './plainte.entity';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Marin {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Plainte, (plainte) => plainte.utilisateur)
  plaintes: Plainte[];
   @Column({ unique: true })
  numero: string;

  @Column({ unique: true })
  numeroIdentification: string;

 @OneToOne(() => User, (user) => user.marin, { nullable: true })
 @JoinColumn()
 user: User | null;

 @Column({ type: 'varchar', length: 4, nullable: true })
  codeConnexion: string | null;
  
@Column({ type: 'timestamp', nullable: true })
codeConnexionExpiresAt: Date | null;


}
