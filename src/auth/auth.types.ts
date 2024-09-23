import { ApiProperty } from '@nestjs/swagger';

export class PostAuth {
  @ApiProperty({ example: '48d3e6e8-945e-4526-b9c7-ae73379cf249' })
  access_token: string;

  @ApiProperty({ example: Date.now() })
  expires_in: number;
}
