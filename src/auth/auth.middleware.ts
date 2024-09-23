import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const authToken = req.headers['authorization'];

    if (!authToken) {
      throw new UnauthorizedException('Authorization header is undefined.');
    }

    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
      req.user = {
        email: decoded.email,
        name: decoded.name,
      };

      next();
    } catch (err) {
      Logger.log(err);
      throw new UnauthorizedException();
    }
  }
}
