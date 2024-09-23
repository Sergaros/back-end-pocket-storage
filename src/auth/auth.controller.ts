import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PostAuth } from './auth.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @ApiOperation({
    summary: 'Auth request, check access token and create JWT token header.',
  })
  @Post()
  async loginVerify(@Body() authData: PostAuth) {
    const { access_token, expires_in } = authData;

    try {
      const { data } = await axios.get(
        'https://www.googleapis.com/oauth2/v1/userinfo',
        {
          params: {
            access_token,
          },
        },
      );

      return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: expires_in });
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException();
    }
  }
}
