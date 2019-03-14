import {Application} from '@feathersjs/feathers';
import {AppServiceTypes} from '../service-types';
import {createUsersModel} from '../../models/users.model';
import {USERS_HOOKS} from './users.hooks';
import * as FeathersSequelize from 'feathers-sequelize';

export function createUsersService(app: Application<AppServiceTypes>) {

  const Model = createUsersModel(app);

  // note: FeathersSequelize provides id on the service which is in turn necessary for the authentication
  app.use('/users', FeathersSequelize({Model}));

  const service = app.service('users');
  service.hooks(USERS_HOOKS);
}
