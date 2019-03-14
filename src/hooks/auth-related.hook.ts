import {HookContext} from '@feathersjs/feathers';
import {BadRequest} from '@feathersjs/errors';
import {isEmailValid, isPasswordValid} from '../utils/validation.utils';

export function validateValuePasswordHook(ctx: HookContext) {
  const {value} = ctx.data;
  if (isPasswordValid(value.password)) {
    return Promise.resolve();
  } else {
    return Promise.reject(new BadRequest('Password does not fit criteria.'));
  }
}

export function validateValueEmailHook(ctx: HookContext) {
  const {value} = ctx.data;
  if (isEmailValid(value.changes.email)) {
    return Promise.resolve();
  } else {
    return Promise.reject(new BadRequest('Email does not fit criteria.'));
  }
}

export function validatePasswordHook(ctx: HookContext) {
  const {password} = ctx.data;
  if (isPasswordValid(password)) {
    return Promise.resolve();
  } else {
    return Promise.reject(new BadRequest('Password does not fit criteria.'));
  }
}

export function validateEmailHook(ctx: HookContext) {
  const {email} = ctx.data;
  if (isEmailValid(email)) {
    return Promise.resolve();
  } else {
    return Promise.reject(new BadRequest('Email does not fit criteria.'));
  }
}
