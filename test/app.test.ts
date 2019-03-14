import {expect} from 'chai';
import * as rp from 'request-promise';
import app from '../src/app';
import * as url from 'url';

const port = app.get('port') || 3030;
const getUrl = (pathname?: string) => url.format({
  hostname: app.get('host') || 'localhost',
  protocol: 'http',
  port,
  pathname
});

describe('Feathers application tests', () => {
  before(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  after(function(done) {
    this.server.close(done);
  });

  it('starts and shows the index page', () => {
    return rp(getUrl()).then((body) =>
      expect(body.indexOf('<html>') !== -1).to.be.true
    );
  });

  describe('404', () => {
    it('shows a 404 HTML page', () => {
      return rp({
        url: getUrl('path/to/nowhere'),
        headers: {
          Accept: 'text/html'
        }
      }).catch((res) => {
        expect(res.statusCode).to.eq(404);
        expect(res.error.indexOf('<html>') !== -1).to.eq(true);
      });
    });

    it('shows a 404 JSON error without stack trace', () => {
      return rp({
        url: getUrl('path/to/nowhere'),
        json: true
      }).catch((res) => {
        expect(res.statusCode).to.eq(404);
        expect(res.error.code).to.eq(404);
        expect(res.error.message).to.eq('Page not found');
        expect(res.error.name).to.eq('NotFound');
      });
    });
  });
});
