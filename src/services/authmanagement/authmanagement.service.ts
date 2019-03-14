import {Application} from '@feathersjs/feathers';
import * as authManagement from 'feathers-authentication-management';
import {AppServiceTypes} from '../service-types';
import {AUTH_MANAGEMENT_HOOKS} from './authmanagement.hooks';
import {setupAuthManagementOptions} from './authmanagement-options';

export function createAuthManagementService(app: Application<AppServiceTypes>) {

  app.configure(authManagement(setupAuthManagementOptions(app)));

  const service = app.service('authManagement');
  service.hooks(AUTH_MANAGEMENT_HOOKS);
}
