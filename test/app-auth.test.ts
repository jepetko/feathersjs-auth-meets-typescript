import {expect, assert, AssertionError} from 'chai';
import * as rp from 'request-promise';
import * as url from 'url';
import * as fg from 'factory-girl';
import * as Sequelize from 'sequelize';
import * as sinon from 'sinon';
import {DEFAULT_PASSWORD} from './factories/users.factory';
import {Notifier} from '../src/services/authmanagement/authmanagement-options';
import {User, UserAttrs} from '../src/models/users.model';
import app from '../src/app';

const port = app.get('port') || 3030;

const getUrl = (pathname?: string) => url.format({
  hostname: app.get('host') || 'localhost',
  protocol: 'http',
  port,
  pathname
});
const buildGetRequest = (pathname, params?: {[key: string]: any}, headers?: {[key: string]: any}) => {
  return {
    method: 'GET',
    uri: getUrl(pathname),
    json: true,
    resolveWithFullResponse: true,
    headers: Object.assign({
      'Content-Type': 'application/json'
    }, headers),
    qs: params
  };
};
const buildPostRequest = (pathname, body, headers?: {[key: string]: any}) => {
  return {
    method: 'POST',
    uri: getUrl(pathname),
    body,
    json: true,
    resolveWithFullResponse: true,
    headers: Object.assign({
      'Content-Type': 'application/json'
    }, headers)
  };
};
const buildAuthenticationPostRequest = (body) => {
  return buildPostRequest('authentication', body);
};
const buildAuthManagementPostRequest = (body) => {
  return buildPostRequest('authManagement', body);
};
const buildUsersPostRequest = (body) => {
  return buildPostRequest('users', body);
};
const checkHttpErrorResponse = (res, expectedStatusCode: number, expectedName: string, expectedMessage: string) => {
  if (Object.getPrototypeOf(res).constructor === AssertionError) {
    throw res;
  }
  const {statusCode} = res;
  expect(statusCode).to.eq(expectedStatusCode);
  const {code, message, name} = res.error;
  expect(code).to.eq(expectedStatusCode);
  expect(name).to.eq(expectedName);
  expect(message).to.eq(expectedMessage);
};

describe('Feathers Authentication endpoint tests', () => {

  const notExistingValidUserEmail = 'new-user@domain.com';
  const notExistingInvalidUserEmail = 'new-user';

  const usersBlacklistedProperties = ['password', 'verifyToken', 'verifyShortToken', 'verifyExpires', 'verifyChanges',
    'resetToken', 'resetShortToken', 'resetExpires'];
  const FIVE_DAYS = 1000 * 60 * 60 * 24 * 5;

  before(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  after(function(done) {
    this.server.close(done);
  });

  describe('/authentication', () => {

    let verifiedUser: User;
    beforeEach(async () => {
      verifiedUser = await fg.factory.create('verifiedUser');
    });

    describe('user credentials okay', () => {

      it('returns a JWT', async () => {
        const res = await rp(buildAuthenticationPostRequest({
          strategy: 'local',
          email: verifiedUser.email,
          password: DEFAULT_PASSWORD
        }));
        expect(res.statusCode).to.eq(201);
        expect(res.body.accessToken).to.be.ok;
        expect(res.body.accessToken.split('.').length).to.eq(3);
      });

    });

    describe('user credentials not okay', () => {

      it('returns error because strategy is not set', async () => {
        try {
          await rp(buildAuthenticationPostRequest({
            email: verifiedUser.email,
            password: DEFAULT_PASSWORD
          }));
          assert.fail('must fail because of missing strategy');
        } catch (res) {
          checkHttpErrorResponse(res, 401, 'NotAuthenticated', 'No auth token');
        }
      });

      it('returns error because strategy is unknown', async () => {
        try {
          await rp(buildAuthenticationPostRequest({
            strategy: 'any',
            email: verifiedUser.email,
            password: DEFAULT_PASSWORD
          }));
          assert.fail('must fail because of missing strategy');
        } catch (res) {
          checkHttpErrorResponse(res, 401, 'NotAuthenticated', 'Strategy any is not permitted');
        }
      });

      it('returns error because the email is invalid', async () => {
        try {
          await rp(buildAuthenticationPostRequest({
            strategy: 'local',
            email: notExistingInvalidUserEmail,
            password: DEFAULT_PASSWORD
          }));
          assert.fail('must fail because of the invalid email');
        } catch (res) {
          checkHttpErrorResponse(res, 401, 'NotAuthenticated', 'Invalid login');
        }
      });

      it('returns error because the password is wrong', async () => {
        try {
          await rp(buildAuthenticationPostRequest({
            strategy: 'local',
            email: verifiedUser.email,
            password: 'wrong'
          }));
          assert.fail('must fail because of the wrong password');
        } catch (res) {
          checkHttpErrorResponse(res, 401, 'NotAuthenticated', 'Invalid login');
        }
      });
    });
  });

  describe('POST /users', () => {

    describe('for correct user/password data', () => {

      let notifierSpy: sinon.SinonSpy;
      let mailerStub: sinon.SinonStub;

      beforeEach(() => {
        notifierSpy = sinon.spy(Notifier, 'onNotify');
        mailerStub = sinon.stub(app.service('mailer'), 'create');
      });

      afterEach(() => {
        notifierSpy.restore();
        mailerStub.restore();
      });

      it('returns 201 for valid email and password', async () => {
        const res = await rp(buildUsersPostRequest({
          email: notExistingValidUserEmail,
          password: '123'
        }));

        expect(res.statusCode).to.eq(201);
        const {body} = res;
        expect(body.isVerified).to.eq(false);
        usersBlacklistedProperties.forEach((prop) => expect(body).not.to.have.property(prop));
      });

      it('sends the verification email', async () => {
        await rp(buildUsersPostRequest({
          email: notExistingValidUserEmail,
          password: '123'
        }));

        const notifierCall = notifierSpy.lastCall;
        const action = notifierCall.args[0] as string;
        const passedUser = notifierCall.args[1] as User;
        expect(action).to.eq('resendVerifySignup');

        const mailerCall = mailerStub.lastCall;
        const args = mailerCall.args[0];
        expect(args).to.eql({
          from: 'mailer@server.io',
          to: 'new-user@domain.com',
          subject: 'Verify Signup',
          html: `http://localhost:4200/signup/verify/${passedUser.verifyToken}`
        });
      });
    });

    it('returns 400 for missing email', async () => {
      try {
        await rp(buildUsersPostRequest({
          password: '123'
        }));
        assert.fail('must fail because of the missing email');
      } catch (res) {
        checkHttpErrorResponse(res, 400, 'BadRequest', 'Email does not fit criteria.');
      }
    });

    it('returns 400 for invalid email', async () => {
      try {
        await rp(buildUsersPostRequest({
          email: notExistingInvalidUserEmail,
          password: '123'
        }));
        assert.fail('must fail because of the invalid email');
      } catch (res) {
        checkHttpErrorResponse(res, 400, 'BadRequest', 'Email does not fit criteria.');
      }
    });

    it('returns 400 for ambiguous email', async () => {
      const user = await fg.factory.create('unverifiedUser');
      try {
        await rp(buildUsersPostRequest({
          email: user.email,
          password: '123'
        }));
        assert.fail('must fail because of the ambiguous email');
      } catch (res) {
        // TODO: should UI see this?
        checkHttpErrorResponse(res, 400, 'BadRequest', 'Validation error');
      }
    });

    it('returns 400 for missing password', async () => {
      try {
        await rp(buildUsersPostRequest({
          email: notExistingValidUserEmail
        }));
        assert.fail('must fail because of the missing password');
      } catch (res) {
        checkHttpErrorResponse(res, 400, 'BadRequest', 'Password does not fit criteria.');
      }
    });

    it('returns 400 for empty password', async () => {
      try {
        await rp(buildUsersPostRequest({
          email: notExistingValidUserEmail,
          password: ''
        }));
        assert.fail('must fail because of the empty password');
      } catch (res) {
        checkHttpErrorResponse(res, 400, 'BadRequest', 'Password does not fit criteria.');
      }
    });

  });

  describe('/authManagement', () => {

    let notifierSpy: sinon.SinonSpy;
    let mailerStub: sinon.SinonStub;
    beforeEach(() => {
      notifierSpy = sinon.spy(Notifier, 'onNotify');
      mailerStub = sinon.stub(app.service('mailer'), 'create');
    });

    afterEach(() => {
      notifierSpy.restore();
      mailerStub.restore();
    });

    describe('registration workflow', () => {

      describe('checkUnique', () => {
        it('return 204 (NoContent) for unique email', async () => {
          const res = await rp(buildAuthManagementPostRequest({
            action: 'checkUnique',
            value: {
              email: notExistingValidUserEmail
            }
          }));

          expect(res.statusCode).to.eq(204);
        });

        it('returns 400 (BadRequest) for ambiguous email', async () => {
          const user = await fg.factory.create('unverifiedUser');
          try {
            await rp(buildAuthManagementPostRequest({
              action: 'checkUnique',
              value: {
                email: user.email
              }
            }));
            assert.fail('must fail because of the ambiguous email');
          } catch (res) {
            checkHttpErrorResponse(res, 400, 'BadRequest', 'Values already taken.');
          }
        });
      });

      describe('resendVerifySignup', () => {

        it('returns 201 (Created) incl. users data for existing user whereas sensible data is not returned', async () => {
          const user = await fg.factory.create('unverifiedUser');

          const res = await rp(buildAuthManagementPostRequest({
            action: 'resendVerifySignup',
            value: {
              email: user.email
            }
          }));

          expect(res.statusCode).to.eq(201);
          expect(res.statusMessage).to.eq('Created');

          const returnedUser = res.body as User;
          expect(returnedUser.isVerified).to.eq(false);
          usersBlacklistedProperties.forEach((prop) => expect(returnedUser).not.to.have.property(prop));

          // check the mailer
          const notifierCall = notifierSpy.lastCall;
          const passedUser = notifierCall.args[1] as User;

          const mailerCall = mailerStub.lastCall;
          const args = mailerCall.args[0];
          expect(args).to.eql({
            from: 'mailer@server.io',
            to: user.email,
            subject: 'Verify Signup',
            html: `http://localhost:4200/signup/verify/${passedUser.verifyToken}`
          });
        });

        it('returns 400 (BadRequest) for not-existing user', async () => {
          try {
            await rp(buildAuthManagementPostRequest({
              action: 'resendVerifySignup',
              value: {
                email: notExistingValidUserEmail
              }
            }));
            assert.fail('must fail because of the wrong mail address');
          } catch (res) {
            checkHttpErrorResponse(res, 400, 'BadRequest', 'User not found.');
          }
        });
      });

      describe('verifySignupLong', () => {

        let user: User;
        beforeEach(async () => {
          user = await fg.factory.create('unverifiedUser');
        });

        it('returns 201 (Created) if the valid token was verified', async () => {

          // 1. generate a signup token
          await rp(buildAuthManagementPostRequest({
            action: 'resendVerifySignup',
            value: {
              email: user.email
            }
          }));

          const client: Sequelize.Sequelize = app.get('sequelizeClient');

          const models = client.models as {[name: string]: Sequelize.Model<any, any>};
          const UserModel = models.users as Sequelize.Model<User, UserAttrs>;

          const storedUser = await UserModel.findOne({where: {email: user.email}});

          // 2. verify the signup token
          const res = await rp(buildAuthManagementPostRequest({
            action: 'verifySignupLong',
            value: storedUser.verifyToken
          }));

          expect(res.statusCode).to.eq(201);
          expect(res.statusMessage).to.eq('Created');

          const returnedUser = res.body as User;
          expect(returnedUser.isVerified).to.eq(true);
          usersBlacklistedProperties.forEach((prop) => expect(returnedUser).not.to.have.property(prop));

          // check the mailer
          const mailerCall = mailerStub.lastCall;
          const args = mailerCall.args[0];
          expect(args).to.eql({
            from: 'mailer@server.io',
            to: returnedUser.email,
            subject: 'Confirm Signup',
            html: 'Thank you for verifying your email.'
          });
        });

        it('returns 400 (BadRequest) for invalid token', async () => {
          try {
            await rp(buildAuthManagementPostRequest({
              action: 'verifySignupLong',
              value: 'bad-token'
            }));
            assert.fail('must fail because of the bad token');
          } catch (res) {
            checkHttpErrorResponse(res, 400, 'BadRequest', 'User not found.');
          }
        });

        describe('token verified', () => {

          it('returns 400 for already verified token', async () => {
            await rp(buildAuthManagementPostRequest({
              action: 'resendVerifySignup',
              value: {
                email: user.email
              }
            }));

            const client: Sequelize.Sequelize = app.get('sequelizeClient');

            const models = client.models as {[name: string]: Sequelize.Model<any, any>};
            const UserModel = models.users as Sequelize.Model<User, UserAttrs>;

            const storedUser = await UserModel.findOne({where: {email: user.email}});

            await rp(buildAuthManagementPostRequest({
              action: 'verifySignupLong',
              value: storedUser.verifyToken
            }));

            try {
              await rp(buildAuthManagementPostRequest({
                action: 'resendVerifySignup',
                value: {
                  email: user.email
                }
              }));
              assert.fail('must fail because of the already verified token -> ');
            } catch (res) {
              checkHttpErrorResponse(res, 400, 'BadRequest', 'User is already verified.');
            }
          });
        });

        describe('token expired', () => {

          it('returns 400 for expired token', async () => {
            await rp(buildAuthManagementPostRequest({
              action: 'resendVerifySignup',
              value: {
                email: user.email
              }
            }));

            const client: Sequelize.Sequelize = app.get('sequelizeClient');

            const models = client.models as {[name: string]: Sequelize.Model<any, any>};
            const UserModel = models.users as Sequelize.Model<User, UserAttrs>;

            const storedUser = await UserModel.findOne({where: {email: user.email}});
            const {verifyExpires, verifyToken} = storedUser;

            const oldVerifyExpires = new Date(verifyExpires as any - FIVE_DAYS);
            await UserModel.update({verifyExpires: oldVerifyExpires}, {where: {email: storedUser.email}});

            try {
              await rp(buildAuthManagementPostRequest({
                action: 'verifySignupLong',
                value: verifyToken
              }));
              assert.fail('must fail because of the expired verify token');
            } catch (res) {
              checkHttpErrorResponse(res, 400, 'BadRequest', 'Verification token has expired.');
            }
          });
        });
      });

    });

    describe('password reset workflow', () => {

      describe('sendResetPwd', () => {

        it('returns 204 for verified user', async () => {

          const verifiedUser = await fg.factory.create('verifiedUser');

          // 3. reset the password
          const res = await rp(buildAuthManagementPostRequest({
            action: 'sendResetPwd',
            value: {
              email: verifiedUser.email
            }
          }));

          expect(res.statusCode).to.eq(201);

          // check the mailer
          const notifierCall = notifierSpy.lastCall;
          const passedUser = notifierCall.args[1] as User;

          const mailerCall = mailerStub.lastCall;
          const args = mailerCall.args[0];
          expect(args).to.eql({
            from: 'mailer@server.io',
            to: verifiedUser.email,
            subject: 'Reset Password',
            html: `http://localhost:4200/reset/${passedUser.resetToken}`
          });
        });

        it('returns 400 for not verified user', async () => {
          const unverifiedUser = await fg.factory.create('unverifiedUser');
          try {
            await rp(buildAuthManagementPostRequest({
              action: 'sendResetPwd',
              value: {
                email: unverifiedUser.email
              }
            }));
            assert.fail('must fail because the user is not verified');
          } catch (res) {
            checkHttpErrorResponse(res, 400, 'BadRequest', 'User is not verified.');
          }
        });
      });

      describe('resetPwdLong', () => {

        let verifiedUser: User;
        let resetToken: string;

        beforeEach(async () => {
          verifiedUser = await fg.factory.create('verifiedUser');

          await rp(buildAuthManagementPostRequest({
            action: 'sendResetPwd',
            value: {
              email: verifiedUser.email
            }
          }));

          // Note: since the token is hashed in the table we need to spy on the authmanagementOptions to get the correct restToken
          const notifierCall = notifierSpy.lastCall;
          resetToken = (notifierCall.args[1] as User).resetToken;
        });

        it('returns 204 for successful password reset', async () => {

          expect(resetToken).to.match(new RegExp(`${verifiedUser.id}__.*`, 'g'));

          const res = await rp(buildAuthManagementPostRequest({
            action: 'resetPwdLong',
            value: {
              token: resetToken,
              password: 'new-password'
            }
          }));

          expect(res.statusCode).to.eq(201);

          // check the mailer
          const mailerCall = mailerStub.lastCall;
          const args = mailerCall.args[0];
          expect(args).to.eql({
            from: 'mailer@server.io',
            to: verifiedUser.email,
            subject: 'Reset Password Confirmation',
            html: 'The password has been reset.'
          });
        });

        it('returns 400 for bad token', async () => {
          try {
            await rp(buildAuthManagementPostRequest({
              action: 'resetPwdLong',
              value: {
                token: `${verifiedUser.id}__1214se54575`,
                password: 'new-password'
              }
            }));
            assert.fail('must fail because of the bad token');
          } catch (res) {
            checkHttpErrorResponse(res, 400, 'BadRequest', 'Token is not in the correct format.');
          }
        });

        it('returns 400 for missing password', async () => {
          try {
            await rp(buildAuthManagementPostRequest({
              action: 'resetPwdLong',
              value: {
                token: resetToken
              }
            }));
            assert.fail('must fail because of the missing password');
          } catch (res) {
            checkHttpErrorResponse(res, 400, 'BadRequest', 'Password does not fit criteria.');
          }
        });

        it('returns 400 for empty password', async () => {
          try {
            await rp(buildAuthManagementPostRequest({
              action: 'resetPwdLong',
              value: {
                token: resetToken,
                password: ''
              }
            }));
            assert.fail('must fail because of the empty password');
          } catch (res) {
            checkHttpErrorResponse(res, 400, 'BadRequest', 'Password does not fit criteria.');
          }
        });

      });
    });

    describe('passwordChange', () => {

      let verifiedUser: User;
      beforeEach(async () => {
        verifiedUser = await fg.factory.create('verifiedUser');
      });

      it('returns 201 for the correct password', async () => {
        const res = await rp(buildAuthManagementPostRequest({
          action: 'passwordChange',
          value: {
            user: {email: verifiedUser.email},
            oldPassword: DEFAULT_PASSWORD,
            password: 'new-pwd'
          }
        }));
        expect(res.statusCode).to.eq(201);

        // check the mailer
        const mailerCall = mailerStub.lastCall;
        const args = mailerCall.args[0];
        expect(args).to.eql({
          from: 'mailer@server.io',
          to: verifiedUser.email,
          subject: 'Change Password',
          html: 'The password has been changed.'
        });
      });

      it('returns 500 for non-existing user', async () => {
        try {
          await rp(buildAuthManagementPostRequest({
            action: 'passwordChange',
            value: {
              user: {email: 'unknown@domain.at'},
              oldPassword: '',
              password: 'new-pwd'
            }
          }));
          assert.fail('must fail because of the non-existing user');
        } catch (res) {
          checkHttpErrorResponse(res, 500, 'GeneralError', `Cannot read property 'password' of undefined`);
        }
      });

      it('returns 400 if the old password is missing', async () => {
        try {
          await rp(buildAuthManagementPostRequest({
            action: 'passwordChange',
            value: {
              user: {email: verifiedUser.email},
              password: 'new-pwd'
            }
          }));
          assert.fail('must fail because of the missing old password');
        } catch (res) {
          checkHttpErrorResponse(res, 400, 'BadRequest', 'Expected string value. (authManagement)');
        }
      });

      it('returns 400 if the old password does not match the current password', async () => {
        try {
          await rp(buildAuthManagementPostRequest({
            action: 'passwordChange',
            value: {
              user: {email: verifiedUser.email},
              oldPassword: 'wrong',
              password: 'new-pwd'
            }
          }));
          assert.fail('must fail because of the wrong old password');
        } catch (res) {
          checkHttpErrorResponse(res, 400, 'BadRequest', 'Current password is incorrect.');
        }
      });

      it('returns 400 if the new password is missing', async () => {
        try {
          await rp(buildAuthManagementPostRequest({
            action: 'passwordChange',
            value: {
              user: {email: verifiedUser.email},
              oldPassword: DEFAULT_PASSWORD
            }
          }));
          assert.fail('must fail because of the missing new password');
        } catch (res) {
          checkHttpErrorResponse(res, 400, 'BadRequest', 'Password does not fit criteria.');
        }
      });

      it('returns 400 if the new password is empty', async () => {
        try {
          await rp(buildAuthManagementPostRequest({
            action: 'passwordChange',
            value: {
              user: {email: verifiedUser.email},
              oldPassword: DEFAULT_PASSWORD,
              password: ''
            }
          }));
          assert.fail('must fail because of the empty new password');
        } catch (res) {
          checkHttpErrorResponse(res, 400, 'BadRequest', 'Password does not fit criteria.');
        }
      });
    });

    describe('identityChange', () => {

      let verifiedUser: User;
      beforeEach(async () => {
        verifiedUser = await fg.factory.create('verifiedUser');
      });

      it('returns 201 for correct user and correct changes', async () => {
        const res = await rp(buildAuthManagementPostRequest({
          action: 'identityChange',
          value: {
            user: {email: verifiedUser.email},
            password: DEFAULT_PASSWORD,
            changes: {
              email: notExistingValidUserEmail
            }
          }
        }));
        expect(res.statusCode).to.eq(201);

        expect(mailerStub.callCount).to.eq(2);

        const args = [mailerStub.firstCall.args[0], mailerStub.secondCall.args[0]];
        expect(args).to.eql([
          {
            from: 'mailer@server.io',
            to: verifiedUser.email,
            subject: 'Change Identity Confirmation',
            html: `The identity has been changed. Your new email is: ${notExistingValidUserEmail}.`
          },
          {
            from: 'mailer@server.io',
            to: notExistingValidUserEmail,
            subject: 'Change Identity Confirmation',
            html: 'The identity has been changed. From now on, this is your email address used for log-in.'
          }
        ]);
      });

      it('returns 400 for non-existing user', async () => {
        try {
          await rp(buildAuthManagementPostRequest({
            action: 'identityChange',
            value: {
              user: {email: 'unknown@domain.at'},
              password: DEFAULT_PASSWORD,
              changes: {
                email: notExistingValidUserEmail
              }
            }
          }));
          assert.fail('must fail because of the non-existing user');
        } catch (res) {
          // TODO: do we want to see this on UI?
          checkHttpErrorResponse(res, 500, 'GeneralError', `Cannot read property 'password' of undefined`);
        }
      });

      it('returns 400 for wrong password', async () => {
        try {
          await rp(buildAuthManagementPostRequest({
            action: 'identityChange',
            value: {
              user: {email: verifiedUser.email},
              password: 'wrong',
              changes: {
                email: notExistingValidUserEmail
              }
            }
          }));
          assert.fail('must fail because of the wrong password');
        } catch (res) {
          checkHttpErrorResponse(res, 400, 'BadRequest', 'Password is incorrect.');
        }
      });

      it('returns 400 for missing new mail in the changes', async () => {
        try {
          await rp(buildAuthManagementPostRequest({
            action: 'identityChange',
            value: {
              user: {email: verifiedUser.email},
              password: DEFAULT_PASSWORD,
              changes: {
              }
            }
          }));
          assert.fail('must fail because of the missing new email');
        } catch (res) {
          checkHttpErrorResponse(res, 400, 'BadRequest', 'Email does not fit criteria.');
        }
      });

      it('returns 400 for bad new email in the changes', async () => {
        try {
          await rp(buildAuthManagementPostRequest({
            action: 'identityChange',
            value: {
              user: {email: verifiedUser.email},
              password: DEFAULT_PASSWORD,
              changes: {
                email: notExistingInvalidUserEmail
              }
            }
          }));
          assert.fail('must fail because of the bad new email');
        } catch (res) {
          checkHttpErrorResponse(res, 400, 'BadRequest', 'Email does not fit criteria.');
        }
      });
    });
  });

  describe('securing services', () => {

    let verifiedUser: User;
    let mailerStub: sinon.SinonStub;

    beforeEach(async () => {
      mailerStub = sinon.stub(app.service('mailer'), 'create');
      verifiedUser = await fg.factory.create('verifiedUser');
    });

    afterEach(() => {
      mailerStub.restore();
    });

    describe('access token not present', () => {

      it('resolves with 401 for the /secrets path', async () => {
        try {
          await rp(buildGetRequest('secrets'));
          assert.fail('must fail because the access token is not set');
        } catch (res) {
          checkHttpErrorResponse(res, 401, 'NotAuthenticated', 'No auth token');
        }
      });

    });

    describe('access token present', () => {

      let headers;
      beforeEach(async () => {
        const res = await rp(buildAuthenticationPostRequest({
          strategy: 'local',
          email: verifiedUser.email,
          password: DEFAULT_PASSWORD
        }));

        headers = {Authorization: `Bearer ${res.body.accessToken}`};
      });

      it('resolves with 200 for the /secrets path', async () => {
        expect((await rp(buildGetRequest('secrets', undefined, headers))).body).to.eql([
          {value: 'very-confidential', id: 1}
        ]);
      });

    });
  });
});
