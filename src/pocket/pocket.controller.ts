import * as fs from 'fs';
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  Patch,
  NotFoundException,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PocketDTO } from './pocket-types';
import { CustomRequest } from 'src/types/custom-request.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Pocket } from './pocket.entity';
import { Like, Not, Repository } from 'typeorm';
import { ListFilter } from 'src/types/common.types';

@ApiTags('pocket')
@Controller('pocket')
export class PocketController {
  constructor(
    @InjectRepository(Pocket)
    private readonly repository: Repository<Pocket>,
  ) {}

  @ApiOperation({ summary: 'Get all pockets available for the user.' })
  @Get()
  async findPockets(
    @Req() req: CustomRequest,
    @Query() filter: ListFilter,
  ): Promise<Pocket[]> {
    const { user } = req;
    const { offset, start, order, name } = filter;

    const where: any = {
      userEmail: user.email,
    };

    if (name) {
      where.name = Like(`%${name}%`);
    }

    const pockets = await this.repository.find({
      where: {
        ...where,
      },
      order: {
        name: order || 'ASC',
      },
      skip: offset || 0,
      take: start || 10,
    });

    return pockets;
  }

  @ApiOperation({ summary: 'Check pocket name if it unique.' })
  @Get('check')
  async checkPocket(
    @Req() req: CustomRequest,
    @Query('name') name: string,
  ): Promise<boolean> {
    const { user } = req;

    const pockets = await this.repository.find({
      where: {
        name,
        userEmail: user.email,
      },
      select: {
        id: true,
      },
    });

    return !!pockets.length;
  }

  @ApiOperation({ summary: 'Get all service users email.' })
  @Get('users')
  async getAllUsersEmail(@Req() req: CustomRequest): Promise<string[]> {
    const { user } = req;

    return this.repository
      .createQueryBuilder('pocket')
      .select('pocket.userEmail')
      .where({ userEmail: Not(user.email) })
      .distinct(true)
      .getRawMany()
      .then((emails) => emails.map((email) => email.pocket_userEmail));
  }

  @ApiOperation({ summary: 'Get pocket by id.' })
  @Get(':id')
  async findPocket(
    @Req() req: CustomRequest,
    @Param('id') id: string,
  ): Promise<Pocket> {
    const { user } = req;

    const pocket: Pocket = await this.repository.findOneBy({
      id,
      userEmail: user.email,
    });

    if (!pocket) {
      throw new NotFoundException(
        'Pocket not exist or you do not have right permissions.',
      );
    }

    return pocket;
  }

  @ApiOperation({ summary: 'Create new pocket.' })
  @Post()
  @HttpCode(201)
  async createPocket(
    @Req() req: CustomRequest,
    @Body() pocketDto: PocketDTO,
  ): Promise<Pocket> {
    const { user } = req;

    return await this.repository.save({
      name: pocketDto.name,
      userEmail: user.email,
    });
  }

  @ApiOperation({ summary: 'Update pocket by id.' })
  @Patch(':id')
  async updatePocket(
    @Req() req: CustomRequest,
    @Param('id') id,
    @Body() pocketDto: PocketDTO,
  ): Promise<Pocket> {
    const { user } = req;

    const pocket = await this.repository.findOneBy({
      id,
      userEmail: user.email,
    });

    if (!pocket) {
      throw new NotFoundException(`Pocket with id '${id}' not found.`);
    }

    return await this.repository.save({
      ...pocket,
      name: pocketDto.name,
    });
  }

  @ApiOperation({ summary: 'Delete pocket by id.' })
  @Delete(':id')
  @HttpCode(204)
  async removePocket(
    @Req() req: CustomRequest,
    @Param('id') id,
  ): Promise<void> {
    const { user } = req;

    const pocket = await this.repository.findOneBy({
      id,
      userEmail: user.email,
    });

    if (!pocket) {
      throw new NotFoundException(`Pocket with id '${id}' not found.`);
    }

    if (fs.existsSync(`uploads/${id}`)) {
      await fs.promises.rm(`uploads/${id}`, { recursive: true, force: true });
    }

    await this.repository.remove(pocket);
  }
}
