import { ApiProperty } from '@nestjs/swagger';

export enum RIGHTS {
  VIEWER,
  EDITOR,
  OWNER,
}

export class permission {
  @ApiProperty({ example: 'johndoe@mail.com' })
  userEmail: string;
  @ApiProperty({ example: '2' })
  rights: RIGHTS;
}

export class PocketDTO {
  @ApiProperty({ example: 'John Doe' })
  name: string;
}
