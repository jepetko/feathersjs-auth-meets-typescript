import {SecretsService} from '../../src/services/secrets/secrets.service';
import app from '../../src/app';

describe('Secrets service', () => {

  let service: SecretsService;

  beforeEach(() => {
    service = app.service('secrets');
  });

  it('returns 200 for every request', async function() {

    const data = {};
    const params = {provider: 'external', authenticated: true};
    const calls = {
      get: service.get(1, params),
      find: service.find(params),
      create: service.create({} as any, params),
      update: service.update(1, {} as any, params),
      patch: service.patch(1, data, params),
      remove: service.remove(1, params)
    };

    const names = Object.keys(calls);
    for (const name of names) {
      await calls[name].should.be.fulfilled;
    }
  });

});
