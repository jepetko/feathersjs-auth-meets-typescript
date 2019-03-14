import * as fg from 'factory-girl';
import * as Sequelize from 'sequelize';
import {defineUserFactory} from './users.factory';
import {User, UserAttrs} from '../../src/models/users.model';

const adapter = new fg.SequelizeAdapter();
fg.factory.setAdapter(adapter);

export function setupUserRelatedFactory(userModel: Sequelize.Model<User, UserAttrs>) {
  defineUserFactory(fg.factory, userModel);
  return fg.factory;
}
