const { Middleware } = require('swagger-express-middleware');
const { initializeMiddleware } = require('swagger-tools');
const { fetchSwagger } = require('./aspsp-resource-server/swagger');
const { app } = require('./app.js');

const dataSource = require('./aspsp-resource-server/datasource');
const error = require('debug')('error');

const mockDataMiddleware = (req, res) => {
  dataSource.mockData(req, (data) => {
    if (!data) {
      res.sendStatus(404);
    } else {
      res.send(data);
    }
  });
};

const schemaValidationErrorMiddleware = (err, req, res, next) => { // eslint-disable-line
  if (err.code && err.code === 'SCHEMA_VALIDATION_FAILED') {
    const responseBuffer = err.originalResponse;
    const originalResponse = responseBuffer ? JSON.parse(responseBuffer.toString()) : '';
    const response = {
      message: 'Schema validation failed',
      errors: err.results.errors,
      originalResponse,
    };
    const message = JSON.stringify(response, null, ' ');
    error(message);
    res.status(500).send(message);
  } else {
    throw err;
  }
};

const initApp = (initFinished) => {
  dataSource.initResources(() => {
    fetchSwagger().then((swaggerFile) => {
      const swaggerObject = require(`../${swaggerFile}`); // eslint-disable-line

      initializeMiddleware(swaggerObject, (toolsMiddleware) => { // init swagger-tools
        const middleware = new Middleware(app);

        middleware.init(swaggerFile, (err) => { // init swagger-express-middleware
          if (err) error(err);

          app.use(
            middleware.metadata(),
            middleware.CORS(),
            middleware.files(),
            middleware.parseRequest(),
            // Validate requests against Swagger
            middleware.validateRequest(),
          );
          app.use(
            toolsMiddleware.swaggerMetadata(),
            // Validate requests and responses against Swagger
            toolsMiddleware.swaggerValidator({ validateResponse: true }),
          );
          app.use(mockDataMiddleware);
          app.use(schemaValidationErrorMiddleware);

          initFinished(app);
        });
      });
    });
  });
};

exports.initApp = initApp;
