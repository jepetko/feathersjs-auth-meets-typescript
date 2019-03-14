import {Application} from '@feathersjs/feathers';
import * as Sequelize from 'sequelize';
import {AppServiceTypes} from './services/service-types';

export default function(app: Application<AppServiceTypes>) {
  const connectionString = app.get('postgres');
  const sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    logging: false,
    operatorsAliases: false,
    define: {
      freezeTableName: true
    }
  });
  const oldSetup = app.setup;

  app.set('sequelizeClient', sequelize);

  app.setup = function(...args) {
    const result = oldSetup.apply(this, args);

    // Set up data relationships
    const models = sequelize.models as {[name: string]: Sequelize.Model<any, any>};
    Object.keys(models).forEach((name: string) => {
      const model: Sequelize.Model<any, any> = models[name];
      if (model.associate) {
        model.associate(models);
      }
    });

    // Sync to the database
    sequelize.sync();

    return result;
  };
}
