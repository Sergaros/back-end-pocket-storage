import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Item } from 'src/item/item.entity';

@Entity()
export class Pocket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'johndoe@mail.com' })
  @Column({ length: 256 })
  userEmail: string;

  @ApiProperty({ example: 'John Doe' })
  @Column({ length: 256 })
  name: string;

  @OneToMany(() => Item, (item) => item.pocket, {
    cascade: ['remove'],
  })
  items: Item[];

  @ApiProperty({ example: new Date() })
  @CreateDateColumn()
  createdDate: Date;

  @ApiProperty({ example: new Date() })
  @UpdateDateColumn()
  updatedDate: Date;
}
