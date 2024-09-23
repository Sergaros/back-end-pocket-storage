import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pocket } from 'src/pocket/pocket.entity';
import { Permission } from './item.permission';
import { ITEM_TYPE } from './item.types';

@Entity()
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 256 })
  name: string;

  @Column({ length: 512, nullable: true })
  path: string;

  @Column()
  size: number;

  @Column({ length: 256, nullable: true })
  parent: string;

  @Column({
    type: 'enum',
    enum: ITEM_TYPE,
    default: ITEM_TYPE.FILE,
  })
  type: ITEM_TYPE;

  @ManyToOne(() => Pocket, (pocket) => pocket.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'pocket_id',
  })
  pocket: Pocket;

  @OneToMany(() => Permission, (permission) => permission.item, {
    cascade: ['remove', 'insert', 'update'],
    eager: true,
  })
  permissions: Permission[];

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;
}
