import * as bcrypt from 'bcryptjs';

const hashPassword = (pwd) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(pwd, salt);
};

export const DEFAULT_PASSWORD = 'pwd';

export function defineUserFactory(factory, model) {
  if (factory.factories.unverifiedUser) {
    return;
  }
  factory.define('unverifiedUser', model, {
    email: factory.sequence('User.email', (i: number) => `user@domain-${i}.at`),
    password: () => hashPassword(DEFAULT_PASSWORD),
    isVerified: false
  });
  factory.extend('unverifiedUser', 'verifiedUser', {
    isVerified: true,
    verifyToken: null,
    verifyShortToken: null,
    verifyExpires: null
  });
}
