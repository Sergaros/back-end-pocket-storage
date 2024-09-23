import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemController } from './item.controller';
import { Item } from './item.entity';
import { Permission } from './item.permission';
import { ItemService } from './item.service';
import { Pocket } from 'src/pocket/pocket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item, Permission, Pocket])],
  controllers: [ItemController],
  providers: [ItemService],
})
export class ItemModule {}
