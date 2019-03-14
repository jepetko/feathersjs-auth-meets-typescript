import auth from '@feathersjs/authentication';
import local from '@feathersjs/authentication-local';
import * as authManagement from 'feathers-authentication-management';
import * as commonHooks from 'feathers-hooks-common';
import {HookContext} from 'feathersjs__feathers';
import {setupAuthManagementOptions} from '../authmanagement/authmanagement-options';
import {validateEmailHook, validatePasswordHook} from '../../hooks/auth-related.hook';

export const USERS_HOOKS = {
  before: {
    all: [],
    find: [
      auth.hooks.authenticate('jwt')
    ],
    get: [
      auth.hooks.authenticate('jwt')
    ],
    create: [
      validateEmailHook,
      validatePasswordHook,
      local.hooks.hashPassword({passwordField: 'password'}),
      authManagement.hooks.addVerification()
    ],
    update: [
      commonHooks.disallow('external')
    ],
    patch: [
      commonHooks.iff(
        commonHooks.isProvider('external'),
        commonHooks.preventChanges(true,
          'email',
          'isVerified',
          'verifyToken',
          'verifyShortToken',
          'verifyExpires',
          'verifyChanges',
          'resetToken',
          'resetShortToken',
          'resetExpires'
        ),
        validatePasswordHook,
        local.hooks.hashPassword({passwordField: 'password'}),
        auth.hooks.authenticate('jwt')
      )
    ],
    remove: [
      auth.hooks.authenticate('jwt')
    ]
  },

  after: {
    all: [local.hooks.protect('password')],
    find: [],
    get: [],
    create: [
      (ctx: HookContext) => {
        setupAuthManagementOptions(ctx.app).notifier('resendVerifySignup', ctx.result);
      },
      authManagement.hooks.removeVerification()
    ],
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
