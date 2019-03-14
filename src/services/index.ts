import {Application} from '@feathersjs/feathers';
import {AppServiceTypes} from './service-types';
import {createUsersService} from './users/users.service';
import {createAuthManagementService} from './authmanagement/authmanagement.service';
import {createMailerService} from './mailer/mailer.service';
import {createSecretsService} from './secrets/secrets.service';

export default function(app: Application<AppServiceTypes>) {
  app.configure(createUsersService);
  app.configure(createAuthManagementService);
  app.configure(createMailerService);
  app.configure(createSecretsService);
}
