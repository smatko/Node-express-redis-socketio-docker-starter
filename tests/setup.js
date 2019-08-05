jest.setTimeout(300000);

const request = require('supertest');
const server = require('../app');

let app;

beforeAll(async (done) => {
  app = await server.listen(5000);
  global.agent = request.agent(app);
  done();
});

afterAll(async (done) => {
    await app.stop();
    done();
});
