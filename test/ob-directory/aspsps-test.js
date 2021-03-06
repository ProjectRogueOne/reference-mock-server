const assert = require('assert');
const request = require('supertest'); // eslint-disable-line
const proxyquire = require('proxyquire');
const env = require('env-var');

const openIdConfigUrl = 'http://localhost/openid/config';

describe('/scim/v2/OBAccountPaymentServiceProviders', () => {
  let aspspsEndpoint;
  let directoryServer;
  let server;

  before(() => {
    aspspsEndpoint = proxyquire('../../lib/ob-directory/aspsps', {
      'env-var': env.mock({
        OPENID_CONFIG_ENDPOINT_URL: openIdConfigUrl,
      }),
    });

    directoryServer = proxyquire('../../lib/ob-directory', {
      './aspsps': aspspsEndpoint,
    });

    server = proxyquire('../../lib/app.js', {
      './ob-directory': directoryServer,
    });
  });


  it('returns JSON payload', (done) => {
    request(server.app)
      .get('/scim/v2/OBAccountPaymentServiceProviders')
      .set('Accept', 'application/json')
      .end((err, res) => {
        const authServer = res.body.Resources[0].AuthorisationServers[0];
        assert.equal(res.status, 200);
        assert.equal(res.body.Resources.length, 3);
        assert.equal(res.body.Resources[0].id, 'aaa-example-bank');
        assert.equal(authServer.CustomerFriendlyName, 'AAA Example Bank');
        assert.equal(authServer.BaseApiDNSUri, 'http://aaa-example-bank.example.com');
        assert.equal(authServer.CustomerFriendlyLogoUri, '');
        assert.equal(authServer.OpenIDConfigEndPointUri, `${openIdConfigUrl}/${res.body.Resources[0].id}`);
        done();
      });
  });
});
