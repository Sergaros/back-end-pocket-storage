import { RIGHTS } from 'src/pocket/pocket-types';

export interface ListFilter {
  name?: string;
  start?: number;
  offset?: number;
  order?: 'ASC' | 'DESC';
}

export interface IUserRole {
  userEmail: string;
  role: RIGHTS;
}
