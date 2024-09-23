// custom-request.interface.ts
import { Request } from 'express';

export interface CustomRequest extends Request {
  user?: any; // Add your custom properties here
}
