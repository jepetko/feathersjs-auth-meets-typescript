import {Application, ServiceMethods} from '@feathersjs/feathers';
import {User} from '../../models/users.model';
import {AppServiceTypes} from '../service-types';
import {MailRequest} from '../mailer/mailer.service';

export type NotifierType = 'resendVerifySignup' | 'verifySignup' | 'sendResetPwd' | 'resetPwd'
  | 'passwordChange' | 'identityChange';
export type NotifierOptions = any;
export interface NotifierReturnType {
  notifier: (type: NotifierType, user: User, notifierOptions?: NotifierOptions) => void;
}
type MailedUserAction = 'verify' | 'reset' | 'verifyChanges';

export class Notifier {

  public static app: Application<AppServiceTypes>;

  public static notify(type: NotifierType, user: User, notifierOptions?: NotifierOptions) {

    if (!Notifier.app) {
      return;
    }

    // user attributes will change during the request processing we need to take a snapshot of the current value
    this.onNotify(type, JSON.parse(JSON.stringify(user)), notifierOptions);

    const from = Notifier.app.get('mailer').username;

    switch (type) {
      case 'resendVerifySignup':
        return Notifier.sendEmail(this.app, {
          from,
          to: user.email,
          subject: 'Verify Signup',
          html: Notifier.getLink('verify', user.verifyToken)
        });
      case 'verifySignup':
        return Notifier.sendEmail(this.app, {
          from,
          to: user.email,
          subject: 'Confirm Signup',
          html: 'Thank you for verifying your email.'
        });
      case 'sendResetPwd':
        return Notifier.sendEmail(this.app, {
          from,
          to: user.email,
          subject: 'Reset Password',
          html: Notifier.getLink('reset', user.resetToken)
        });
      case 'resetPwd':
        return Notifier.sendEmail(this.app, {
          from,
          to: user.email,
          subject: 'Reset Password Confirmation',
          html: 'The password has been reset.'
        });
      case 'passwordChange':
        return Notifier.sendEmail(this.app, {
          from,
          to: user.email,
          subject: 'Change Password',
          html: 'The password has been changed.'
        });
      case 'identityChange':
        return Promise.resolve(
          [
            Notifier.sendEmail(this.app, {
              from,
              to: user.email,
              subject: 'Change Identity Confirmation',
              html: `The identity has been changed. Your new email is: ${user.verifyChanges.email}.`
            }),
            Notifier.sendEmail(this.app, {
              from,
              to: user.verifyChanges.email,
              subject: 'Change Identity Confirmation',
              html: 'The identity has been changed. From now on, this is your email address used for log-in.'
            })
          ]);
      default:
    }
  }

  /**
   * kind of event handle, might be useful for spying on
   * @param type
   * @param user
   * @param notifierOptions
   */
  public static onNotify(type: NotifierType, user: User, notifierOptions?: NotifierOptions) {
    // noop
  }

  private static getLink(userAction: MailedUserAction, token: string) {
    if (userAction === 'verify') {
      return `http://localhost:4200/signup/${userAction}/${token}`;
    }
    return `http://localhost:4200/${userAction}/${token}`;
  }

  private static sendEmail(app: Application<AppServiceTypes>, mail: MailRequest) {
    const mailer = app.service('mailer') as ServiceMethods<MailRequest>;
    return mailer.create(mail);
  }

  private constructor() {}
}

export function setupAuthManagementOptions(app: Application<AppServiceTypes>): NotifierReturnType {
  Notifier.app = app;
  return {
    notifier: (...args) => Notifier.notify(...args)
  };
}
