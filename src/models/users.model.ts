import {Application} from '@feathersjs/feathers';
import * as Sequelize from 'sequelize';

/**
 * attributes
 */
export interface UserAttrs {
  email: string;
  password: string;
  isVerified: boolean;
  verifyToken: string;
  verifyShortToken: string;
  verifyExpires: Date;
  verifyChanges: {[key: string]: string};
  resetToken: string;
  resetShortToken: string;
  resetExpires: Date;
}

/**
 * instance
 * Note: id, created_at, updated_at are auto-added by Sequelize
 */
export interface User extends UserAttrs {
  id: number;
  created_at: Date;
  updated_at: Date;
}

export function createUsersModel(app: Application<object>): Sequelize.Model<User, UserAttrs> {
  const client = app.get('sequelizeClient') as Sequelize.Sequelize;
  const packages = client.define<User, UserAttrs>('users', {
    email: {
      type: Sequelize.STRING(254),
      unique: true,
      allowNull: false
    },
    password: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    isVerified: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    verifyToken: {
      type: Sequelize.STRING,
      allowNull: true
    },
    verifyShortToken: {
      type: Sequelize.STRING,
      allowNull: true
    },
    verifyExpires: {
      type: Sequelize.DATE,
      allowNull: true
    },
    verifyChanges: {
      type: Sequelize.JSONB,
      allowNull: true
    },
    resetToken: {
      type: Sequelize.STRING,
      allowNull: true
    },
    resetShortToken: {
      type: Sequelize.STRING,
      allowNull: true
    },
    resetExpires: {
      type: Sequelize.DATE,
      allowNull: true
    }
  }, {
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  packages.associate = (models: Sequelize.ModelsHashInterface) => {
    // no associations so far
    // use this method to wire up the models
  };

  return packages;
}
