// Application hooks that run for every service
import loggerHook from './hooks/log';

export const APP_HOOKS = {
  before: {
    all: [ loggerHook() ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [ loggerHook() ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  error: {
    all: [ loggerHook() ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
