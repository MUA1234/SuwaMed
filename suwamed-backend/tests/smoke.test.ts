import request from 'supertest';
import app from '../server';

describe('SuwaMed API smoke tests', () => {
  it('GET /api/unknown returns 404 in the standard error envelope', async () => {
    const res = await request(app).get('/api/totally-not-a-route');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
  });

  it('GET /api/auth/me without a token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/openapi.json returns the OpenAPI 3.0 document', async () => {
    const res = await request(app).get('/api/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.info?.title).toBe('SuwaMed API');
  });

  it('POST /api/auth/login with missing body returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    // Joi validator -> 400; if anything else slips through that's a regression.
    expect([400, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});
