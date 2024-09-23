import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pocket } from 'src/pocket/pocket.entity';
import { Permission } from './item.permission';

import { ITEM_ACTION, ITEM_TYPE, RIGHTS } from './item.types';
import { Item } from './item.entity';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Pocket)
    private readonly repositoryPocket: Repository<Pocket>,
    @InjectRepository(Item)
    private readonly repositoryItem: Repository<Item>,
    @InjectRepository(Permission)
    private readonly repositoryPermission: Repository<Permission>,
  ) {}

  async IsActionValid(
    userEmail: string,
    itemId: string,
    action: ITEM_ACTION,
  ): Promise<boolean> {
    const itemPermissions = await this.repositoryPermission.find({
      where: {
        userEmail,
        item: { id: itemId },
      },
    });

    if (!itemPermissions.length) {
      return false;
    }

    const roles = itemPermissions.map(({ role }) => role as RIGHTS);

    switch (action) {
      case ITEM_ACTION.DOWNLOAD:
        return roles.length > 0;
      case ITEM_ACTION.UPLOAD:
        return roles.includes(RIGHTS.OWNER);
      case ITEM_ACTION.COPY:
      case ITEM_ACTION.RENAME:
      case ITEM_ACTION.DELETE:
        return roles.includes(RIGHTS.OWNER) || roles.includes(RIGHTS.EDITOR);
      default:
        return false;
    }
  }

  async IsPocketOwner(userEmail: string, pocketId: string): Promise<boolean> {
    const pocket = await this.repositoryPocket.findBy({
      id: pocketId,
      userEmail,
    });

    return !!pocket;
  }

  SerializeItem(item: Item): Partial<Item> {
    const {
      id,
      name,
      type,
      parent,
      permissions,
      size,
      createdDate,
      updatedDate,
    } = item;
    return {
      id,
      name,
      type,
      parent,
      permissions,
      size,
      createdDate,
      updatedDate,
    };
  }

  SerializePremissions(
    userEmail: string,
    permissions: Permission[],
  ): Permission[] {
    const userRole = permissions.find((role) => role.userEmail === userEmail);

    if (!userRole) {
      return null;
    }

    return userRole.role === RIGHTS.OWNER ? permissions : [userRole];
  }

  async GetChildren(
    userEmail: string,
    parentId: string,
    all: boolean = false,
  ): Promise<Item[]> {
    const children = [];
    const items = await this.repositoryItem.find({
      where: {
        parent: parentId,
      },
      relations: ['permissions'],
    });

    const filtredItems = all
      ? [...items]
      : items.filter(
          ({ permissions }) =>
            !!permissions.find((perm) => perm.userEmail === userEmail),
        );

    children.push(...filtredItems);

    for (let i = 0; i < filtredItems.length; i++) {
      if (filtredItems[i].type === ITEM_TYPE.DIRECTORY) {
        const nestedItem = await this.GetChildren(
          userEmail,
          filtredItems[i].id,
        );
        children.push(...nestedItem);
      }
    }

    return children;
  }

  async UpdateItemPermissions(
    item: Item,
    permissions: Partial<Permission>[],
  ): Promise<void> {
    const perms = await this.repositoryPermission.find({
      where: {
        item: { id: item.id },
      },
    });

    await Promise.all(
      perms.map(async (perm) => {
        if (perm.role !== RIGHTS.OWNER) {
          await this.repositoryPermission.delete(perm.id);
        }
      }),
    );

    await Promise.all(
      permissions.map(async (perm) => {
        const permission = new Permission();
        permission.userEmail = perm.userEmail;
        permission.role = perm.role;
        permission.item = item;

        await this.repositoryPermission.save(permission);
      }),
    );
  }
}
