
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Role } from './role.enum';
import { Marin } from 'src/Entity/marin.entity';
import { Admin } from 'src/Entity/admin.entity';



@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToOne(() => Marin, (marin) => marin.user, { cascade: true, nullable: true })
  marin?: Marin; 
  @Column({ type: 'json', nullable: true })
  refreshToken: any;
 @Column({
    type: 'enum',
    enum: Role,
    default: Role.MARIN,
  })
  role: Role;

@OneToOne(() => Admin, admin => admin.user)
admin: Admin;

  
}
