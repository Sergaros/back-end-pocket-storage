import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PocketController } from './pocket.controller';
import { Pocket } from './pocket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pocket])],
  controllers: [PocketController],
})
export class PocketModule {}
