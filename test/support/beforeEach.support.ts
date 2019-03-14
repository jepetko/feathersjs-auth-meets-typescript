import * as Sequelize from 'sequelize';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import app from '../../src/app';
import {User, UserAttrs} from '../../src/models/users.model';
import {setupUserRelatedFactory} from '../factories';

chai.should();
chai.use(chaiAsPromised);

/**
 * setup factories and truncate the database
 */
beforeEach(async () => {
  const client: Sequelize.Sequelize = app.get('sequelizeClient');

  const models = client.models as {[name: string]: Sequelize.Model<any, any>};
  const UserModel = models.users as Sequelize.Model<User, UserAttrs>;

  await UserModel.destroy({truncate: true});

  setupUserRelatedFactory(UserModel);
});
