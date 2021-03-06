const express = require('express');
const { OBAccountPaymentServiceProviders } = require('./ob-directory');
const { createToken } = require('./aspsp-authorisation-server');
const { accountRequests } = require('./aspsp-authorisation-server/account-requests');
const { openIdConfig } = require('./aspsp-open-id-config');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();

if (process.env.NODE_ENV !== 'test') { // don't log requests when testing
  app.use(morgan('dev')); // for logging
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/token', createToken);
app.post('/account-requests', accountRequests.post);
app.get('/account-requests/:id', accountRequests.get);
app.delete('/account-requests/:id', accountRequests.del);
app.get('/openid/config/:id', openIdConfig.get);
app.use('/scim/v2/OBAccountPaymentServiceProviders', OBAccountPaymentServiceProviders);

exports.app = app;
