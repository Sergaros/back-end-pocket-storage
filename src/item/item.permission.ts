import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Item } from 'src/item/item.entity';
import { RIGHTS } from './item.types';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 256 })
  userEmail: string;

  @Column({
    type: 'enum',
    enum: RIGHTS,
    default: RIGHTS.VIEWER,
  })
  role: RIGHTS;

  @ManyToOne(() => Item, (item) => item.permissions, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'item_id',
  })
  item: Item;
}
