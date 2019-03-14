import {ServiceMethods} from '@feathersjs/feathers';
import * as featherErrors from '@feathersjs/errors';
import app from '../../src/app';

describe('Mailer service', () => {

  let service: ServiceMethods<any>;
  beforeEach(() => {
    service = app.service('mailer');
  });

  it('does not allow external access', async function() {

    const params = {provider: 'external'};
    await service.create({} as any, params).should.be.rejectedWith(featherErrors.MethodNotAllowed,
      `Provider 'external' can not call 'create'. (disallow)`);
  });

});
