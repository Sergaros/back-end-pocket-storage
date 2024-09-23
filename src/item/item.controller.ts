import * as fs from 'fs';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { IUserRole } from 'src/types/common.types';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Item } from './item.entity';
import { CustomRequest } from 'src/types/custom-request.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import {
  CreateDirectory,
  ITEM_ACTION,
  ITEM_TYPE,
  PatchItem,
  RIGHTS,
  UploadItem,
} from './item.types';
import { Pocket } from 'src/pocket/pocket.entity';
import { ItemService } from './item.service';
import { FileUploadInterceptor } from './itemFileUploadInterceptor';

@ApiTags('item')
@Controller('item')
export class ItemController {
  constructor(
    @InjectRepository(Pocket)
    private readonly repositoryPocket: Repository<Pocket>,
    @InjectRepository(Item)
    private readonly repositoryItem: Repository<Item>,
    private readonly itemService: ItemService,
  ) {}

  @ApiOperation({ summary: 'Get all items from the pocket.' })
  @Get(':pocketId')
  async findItems(
    @Req() req: CustomRequest,
    @Param('pocketId') pocketId: string,
  ): Promise<Partial<Item>[]> {
    const { user } = req;

    const pockets = await this.repositoryPocket.find({
      where: {
        id: pocketId,
        userEmail: user.email,
      },
      relations: ['items'],
    });

    if (!pockets.length) {
      throw new NotFoundException(
        'Pocket not exist or you do not have right permissions.',
      );
    }

    return pockets[0].items.map(this.itemService.SerializeItem);
  }

  @ApiOperation({ summary: 'Check item name if it unique.' })
  @Get(':pocketId/check')
  async checkItem(
    @Req() req: CustomRequest,
    @Param() params: any,
    @Query('name') name: string,
    @Query('parent') parent: string,
  ): Promise<boolean> {
    const { user } = req;
    const { pocketId } = params;

    const isValid = await this.itemService.IsPocketOwner(user.email, pocketId);

    if (!isValid) {
      throw new ForbiddenException();
    }

    const whereConfig: any = { name };
    if (parent) {
      whereConfig.parent = parent;
    } else {
      whereConfig.parent = IsNull();
    }

    const items = await this.repositoryItem.find({
      where: {
        ...whereConfig,
      },
      select: {
        id: true,
      },
    });

    return !!items.length;
  }

  @ApiOperation({ summary: 'Get item(file/directory) by id.' })
  @Get(':pocketId/:id')
  async findItem(
    @Req() req: CustomRequest,
    @Param() params: any,
  ): Promise<Partial<Item>[]> {
    const { user } = req;
    const { pocketId, id } = params;

    const isValid = await this.itemService.IsActionValid(
      user.email,
      id,
      ITEM_ACTION.DOWNLOAD,
    );

    if (!isValid) {
      throw new ForbiddenException();
    }

    let items = await this.repositoryItem.find({
      where: {
        id: id,
        pocket: { id: pocketId },
      },
      relations: ['permissions'],
    });

    if (!items.length) {
      throw new NotFoundException(
        `Item with id ${id} not found in this pocket.`,
      );
    }

    if (items[0].type === ITEM_TYPE.DIRECTORY) {
      items = [
        items[0],
        ...(await this.itemService.GetChildren(user.email, items[0].id)),
      ];
    }

    return items.map((item) => {
      const sItem = this.itemService.SerializeItem(item);
      sItem.permissions = [
        ...this.itemService.SerializePremissions(user.email, sItem.permissions),
      ];
      return sItem;
    });
  }

  @ApiOperation({ summary: 'Download item by id' })
  @Get(':pocketId/:id/download')
  async downloadFile(
    @Req() req: CustomRequest,
    @Res() res: Response,
    @Param() params: any,
  ) {
    const { user } = req;
    const { pocketId, id } = params;

    const isValid = await this.itemService.IsActionValid(
      user.email,
      id,
      ITEM_ACTION.DOWNLOAD,
    );

    if (!isValid) {
      throw new ForbiddenException();
    }

    const items = await this.repositoryItem.find({
      where: {
        id: id,
        pocket: { id: pocketId },
      },
      relations: ['permissions'],
    });

    if (!items.length) {
      throw new NotFoundException(
        `Item with id ${id} not found in this pocket.`,
      );
    }

    if (existsSync(items[0].path)) {
      // @ts-expect-error download is undefined for some reason
      return res.download(items[0].path);
    } else {
      throw new BadRequestException('File not found');
    }
  }

  @ApiOperation({ summary: 'Create directory in the pocket.' })
  @Post('/:pocketId/directory')
  @HttpCode(201)
  async createDirectory(
    @Req() req: CustomRequest,
    @Param('pocketId') pocketId,
    @Body() body: CreateDirectory,
  ): Promise<Partial<Item>> {
    const { user } = req;
    const { dirName, parentId, permissions } = body;

    const isValid = await this.itemService.IsPocketOwner(user.email, pocketId);

    if (!isValid) {
      throw new ForbiddenException();
    }

    const directory = await this.repositoryItem.save({
      name: dirName,
      type: ITEM_TYPE.DIRECTORY,
      size: 0,
      parent: parentId,
      pocket: pocketId,
      permissions: [
        {
          userEmail: req.user.email,
          role: RIGHTS.OWNER,
        },
        ...permissions,
      ],
    });

    return this.itemService.SerializeItem(directory);
  }

  @ApiOperation({ summary: 'Update item by id.' })
  @Patch('/:pocketId/:id')
  async updateItem(
    @Req() req: CustomRequest,
    @Param('pocketId') pocketId: string,
    @Param('id') id: string,
    @Body() body: PatchItem,
  ): Promise<Item[]> {
    const { user } = req;
    const { name, permissions, parent } = body;

    const isValid = await this.itemService.IsActionValid(
      user.email,
      id,
      ITEM_ACTION.RENAME,
    );

    if (!isValid) {
      throw new ForbiddenException();
    }

    const items = await this.repositoryItem.find({
      where: {
        id: id,
        pocket: { id: pocketId },
      },
      relations: ['permissions'],
    });

    if (!items.length) {
      throw new NotFoundException(
        `Item with id ${id} not found in this pocket.`,
      );
    }

    const updatedItem: Partial<Item> = {};
    if (name || parent) {
      if (name) {
        updatedItem.name = name;
      }

      if (parent) {
        updatedItem.parent = parent === 'root' ? null : parent;
      }

      await this.repositoryItem.save({
        ...items[0],
        ...updatedItem,
      });
    }

    let children = [];
    if (permissions) {
      await this.itemService.UpdateItemPermissions(items[0], permissions);

      if (items[0].type === ITEM_TYPE.DIRECTORY) {
        children = await this.itemService.GetChildren(
          user.email,
          items[0].id,
          true,
        );
        await Promise.all(
          children.map((child) =>
            this.itemService.UpdateItemPermissions(child, permissions),
          ),
        );
        children = await this.itemService.GetChildren(
          user.email,
          items[0].id,
          true,
        );
      }
    }

    const updatedItems = await this.repositoryItem.find({
      where: {
        id: id,
        pocket: { id: pocketId },
      },
      relations: ['permissions'],
    });

    return [updatedItems[0], ...children];
  }

  @ApiOperation({ summary: 'Upload file to the pocket.' })
  @Post('/:pocketId/upload')
  @HttpCode(201)
  @UseInterceptors(
    FileUploadInterceptor,
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const pocketId = req.params['pocketId'];
          const destPath = `./uploads/${pocketId}/`;

          if (!existsSync(destPath)) {
            mkdirSync(destPath, { recursive: true });
          }

          cb(null, destPath);
        },
        filename: (req, file, cb) => {
          const fileExtName = extname(file.originalname);
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${fileExtName}`);
        },
      }),
    }),
  )
  async uploadFile(
    @Req() req: CustomRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadItem,
    @Param('pocketId') pocketId,
  ): Promise<Partial<Item>> {
    const { parentId, permissions } = body;
    const userPermisions = [];

    try {
      const permissionsObj: IUserRole[] | null = permissions
        ? JSON.parse(permissions)
        : null;

      if (permissionsObj) {
        permissionsObj.forEach(({ userEmail, role }) => {
          userPermisions.push({ userEmail, role });
        });
      }
    } catch (err) {
      Logger.log(err);
      throw new BadRequestException('Item permissions are not valid.');
    }

    const item = await this.repositoryItem.save({
      name: file.originalname,
      path: file.path,
      size: file.size,
      parent: parentId,
      pocket: pocketId,
      permissions: [
        {
          userEmail: req.user.email,
          role: RIGHTS.OWNER,
        },
        ...userPermisions,
      ],
    });

    return this.itemService.SerializeItem(item);
  }

  @ApiOperation({ summary: 'Delete file/directory by id.' })
  @Delete(':pocketId/:id')
  @HttpCode(204)
  async deleteItem(
    @Req() req: CustomRequest,
    @Param() params: any,
  ): Promise<void> {
    const { pocketId, id } = params;

    const isValid = await this.itemService.IsActionValid(
      req.user.email,
      id,
      ITEM_ACTION.DELETE,
    );

    if (!isValid) {
      throw new ForbiddenException(
        'You have not enought permissions to delete this item.',
      );
    }

    const items = await this.repositoryItem.find({
      where: {
        id: id,
        pocket: { id: pocketId },
      },
      loadEagerRelations: false,
    });

    if (!items.length) {
      throw new NotFoundException(
        `Item with id ${id} not found in this pocket.`,
      );
    }

    if (items[0].type === ITEM_TYPE.DIRECTORY) {
      const childrenItems = await this.itemService.GetChildren(
        req.user.email,
        items[0].id,
      );
      const isActionsEnabled = await Promise.all(
        childrenItems.map((item) =>
          this.itemService.IsActionValid(
            req.user.email,
            item.id,
            ITEM_ACTION.DELETE,
          ),
        ),
      );

      if (isActionsEnabled.find((action) => action === false)) {
        throw new ForbiddenException(
          'You have not enought permission to delete some nested items.',
        );
      }

      await Promise.all(
        childrenItems.map(async (item) => {
          await this.repositoryItem.delete({ id: item.id });

          if (fs.existsSync(item.path)) {
            await fs.promises.rm(item.path, { recursive: true, force: true });
          }
        }),
      );
    }

    await this.repositoryItem.delete({ id: items[0].id });
    if (fs.existsSync(items[0].path)) {
      await fs.promises.rm(items[0].path, { recursive: true, force: true });
    }
  }
}
