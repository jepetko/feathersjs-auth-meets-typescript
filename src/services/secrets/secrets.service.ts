import {Model} from 'sequelize';
import {Application, Id, NullableId, Paginated, Params, ServiceMethods} from '@feathersjs/feathers';
import {AppServiceTypes} from '../service-types';
import {SECRETS_HOOKS} from './secrets.hooks';
import {Secret} from '../../models/secrets.model';

export class SecretsService implements ServiceMethods<Secret> {

  constructor(private app: Application<AppServiceTypes>) {
  }

  public async create(data: Partial<Secret>, params?: Params): Promise<Secret> {
    return this.resolve();
  }

  public get(id: Id, params?: Params): Promise<Secret> {
    return this.resolve();
  }

  public find(params?: Params): Promise<Secret[] | Paginated<Secret>> {
    return Promise.resolve([{value: 'very-confidential', id: 1}]);
  }

  public update(id: NullableId, data: Secret, params?: Params): Promise<Secret> {
    return this.resolve();
  }

  public patch(id: NullableId, data: Partial<Secret>, params?: Params): Promise<Secret> {
    return this.resolve();
  }

  public remove(id: NullableId, params?: Params): Promise<Secret> {
    return this.resolve();
  }

  private resolve<T = Secret | Secret[]>() {
    return Promise.resolve(null);
  }
}

export function createSecretsService(app: Application<AppServiceTypes>) {

  const secretsService = new SecretsService(app);

  app.use('/secrets', secretsService);

  const service = app.service('secrets');
  service.hooks(SECRETS_HOOKS);
}
