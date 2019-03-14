import {User} from '../models/users.model';
import {Secret} from '../models/secrets.model';

export interface AppServiceTypes {
  Users: User;
  Secrets: Secret;
}
