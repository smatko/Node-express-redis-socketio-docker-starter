test('Test user creation', async () => {
  const response = await global.agent
  .post('/api/users')
  .send({name: 'test', email: 'test125test.test', password: 'test'})
  .set('Accept', 'application/json');
  expect(response.statusCode).toBe(200);
});