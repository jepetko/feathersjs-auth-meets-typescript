import * as path from 'path';
import * as favicon from 'serve-favicon';
import * as compress from 'compression';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as logger from 'winston';
import feathers from '@feathersjs/feathers';
import * as configuration from '@feathersjs/configuration';
import * as express from '@feathersjs/express';

import middleware from './middleware';
import services from './services';
import {APP_HOOKS} from './app.hooks';
import channels from './channels';
import authentication from './authentication';
import sequelize from './sequelize';

const app = express(feathers());

// Load app configuration
app.configure(configuration());

// Enable security, CORS, compression, favicon and body parsing
app.use(helmet())
  .use(cors())
  .use(compress())
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(favicon(path.join(app.get('public'), 'favicon.ico')))
  // Host the public folder
  .use('/', express.static(app.get('public')))
  // fixes https://github.com/feathersjs/authentication/issues/384
  .configure(express.rest())
  // sequelize configuration
  .configure(sequelize)
  // Configure other middleware (see `middleware/index.ts`)
  .configure(middleware)
  // Set up authentication
  .configure(authentication)
  // Set up our services (see `services/index.ts`)
  .configure(services)
  // Set up event channels (see channels.ts)
  .configure(channels)
  // Configure a middleware for 404s and the error handler
  .use(express.notFound())
  .use(express.errorHandler({ logger, json(err, req, res, next) {
      res.json(err);
    }}));

app.hooks(APP_HOOKS);

export default app;
