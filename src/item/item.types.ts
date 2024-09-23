import { ApiProperty } from '@nestjs/swagger';
import { Permission } from './item.permission';

export enum RIGHTS {
  VIEWER,
  EDITOR,
  OWNER,
}

export enum ITEM_TYPE {
  FILE,
  DIRECTORY,
}

export enum ITEM_ACTION {
  DOWNLOAD,
  UPLOAD,
  RENAME,
  DELETE,
  COPY,
}

export interface permission {
  userEmail: string;
  rights: RIGHTS;
}

export class PatchItem {
  @ApiProperty({ example: 'file.txt' })
  name?: string;

  @ApiProperty({ example: [{ userEmail: 'johndou@gmail.com', role: 2 }] })
  permissions?: Partial<Permission>[];

  @ApiProperty({ example: 'dir_1' })
  parent?: string;
}

export class UploadItem {
  @ApiProperty({ example: 'file.txt' })
  name: string;

  @ApiProperty({ example: `[{ userEmail: 'johndou@gmail.com', role: 2}]` })
  permissions: string;

  @ApiProperty({ example: '48d3e6e8-945e-4526-b9c7-ae73379cf249' })
  parentId: string;
}

export class CreateDirectory {
  @ApiProperty({ example: 'file.txt' })
  dirName: string;

  @ApiProperty({ example: [{ userEmail: 'johndou@gmail.com', role: 2 }] })
  permissions: Partial<Permission>[];

  @ApiProperty({ example: '48d3e6e8-945e-4526-b9c7-ae73379cf249' })
  parentId: string;
}
