import {Application} from '@feathersjs/feathers';
import {AppServiceTypes} from '../service-types';
import {MAILER_HOOKS} from './mailer.hooks';
import * as Mailer from 'feathers-mailer';
import * as smtpTransport from 'nodemailer-smtp-transport';

export interface MailRequest {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export function createMailerService(app: Application<AppServiceTypes>) {

  const mailerConfig = app.get('mailer') as {host: string, username: string, password: string};

  app.use('/mailer', Mailer(smtpTransport({
    host: mailerConfig.host,
    secure: true,
    auth: {
      user: mailerConfig.username,
      pass: mailerConfig.password
    }
  })));

  const service = app.service('mailer');
  service.hooks(MAILER_HOOKS);
}
