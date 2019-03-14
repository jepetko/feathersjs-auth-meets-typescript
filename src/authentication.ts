import {Application} from '@feathersjs/feathers';
import * as auth from '@feathersjs/authentication';
import * as local from '@feathersjs/authentication-local';
import * as jwt from '@feathersjs/authentication-jwt';

export default function setupAuthentication(app: Application<object>) {
  const config = app.get('authentication');

  app.configure(auth(config))
    .configure(local())
    .configure(jwt());

  app.service('authentication').hooks({
    before: {
      create: [
        auth.hooks.authenticate(config.strategies)
      ],
      remove: [
        auth.hooks.authenticate('jwt')
      ]
    }
  });
}
