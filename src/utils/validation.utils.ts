// tslint:disable-next-line
const EMAIL_PATTERN = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function isEmailValid(email: string) {
  EMAIL_PATTERN.lastIndex = 0;
  return email && EMAIL_PATTERN.test(email);
}

export function isPasswordValid(password: string) {
  return typeof password === 'string' && password.trim() !== '';
}
