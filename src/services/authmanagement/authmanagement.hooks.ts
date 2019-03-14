import {HookContext} from '@feathersjs/feathers';
import * as commonHooks from 'feathers-hooks-common';
import {validateValueEmailHook, validateValuePasswordHook} from '../../hooks/auth-related.hook';

export const AUTH_MANAGEMENT_HOOKS = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      commonHooks.iff((ctx: HookContext) => {
        const {action} = ctx.data;
        return ['resetPwdLong', 'passwordChange'].includes(action);
      }, validateValuePasswordHook),
      commonHooks.iff((ctx: HookContext) => {
        const {action} = ctx.data;
        return action === 'identityChange';
      }, validateValueEmailHook)
    ],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
