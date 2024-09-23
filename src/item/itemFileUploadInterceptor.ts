import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { ItemService } from './item.service';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  constructor(private readonly itemService: ItemService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const user = request;
    const pocketId = request.params['pocketId'];

    const isValid = await this.itemService.IsPocketOwner(user.email, pocketId);
    if (!isValid) {
      throw new ForbiddenException();
    }

    return next.handle();
  }
}
