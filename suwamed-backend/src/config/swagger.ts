import swaggerJsdoc from 'swagger-jsdoc';
import type { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SuwaMed API',
      version: '1.0.0',
      description:
        'REST + Socket.io surface for the SuwaMed telehealth platform. ' +
        'JWT bearer auth on every route except `/api/auth/*`, `/api/slmc/verify/:slmcNo`, `/api/health-tips` (public).',
    },
    servers: [{ url: '/api', description: 'Current host' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        AuthLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AppointmentCheckSymptom: {
          type: 'object',
          required: ['symptoms'],
          properties: {
            symptoms: { type: 'array', items: { type: 'string' } },
            bodyArea: { type: 'string' },
            language: { type: 'string', enum: ['en', 'si', 'ta'] },
            additionalNotes: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Email/password login',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLogin' } } },
          },
          responses: {
            '200': { description: 'Returns JWT access + refresh tokens and user profile' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/register': {
        post: { tags: ['Auth'], summary: 'Register patient or doctor', security: [], responses: { '201': { description: 'Created' } } },
      },
      '/auth/verify-otp': {
        post: { tags: ['Auth'], summary: 'Verify the 6-digit OTP from email', security: [], responses: { '200': { description: 'Verified' } } },
      },
      '/auth/me': {
        get: { tags: ['Auth'], summary: 'Current user profile', responses: { '200': { description: 'OK' } } },
      },
      '/auth/account': {
        delete: { tags: ['Auth'], summary: 'Delete the calling user account (requires password)', responses: { '200': { description: 'Deleted' } } },
      },
      '/appointments': {
        get: { tags: ['Appointments'], summary: 'List appointments for current user', responses: { '200': { description: 'OK' } } },
        post: { tags: ['Appointments'], summary: 'Create a booking', responses: { '201': { description: 'Created' } } },
      },
      '/appointments/{id}/confirm': {
        put: { tags: ['Appointments'], summary: 'Confirm + write Payment row', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Confirmed' } } },
      },
      '/appointments/{id}/cancel': {
        put: { tags: ['Appointments'], summary: 'Cancel — notifies both sides', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Cancelled' } } },
      },
      '/consultations/{appointmentId}/token': {
        post: {
          tags: ['Consultations'],
          summary: 'Mint a 1-hour Agora RTC token scoped to this appointment',
          parameters: [{ name: 'appointmentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Returns appId, channelName, token, uid' },
            '400': { description: 'Appointment not video / not active' },
            '503': { description: 'Agora not configured' },
          },
        },
      },
      '/chat/{appointmentId}/messages': {
        get: {
          tags: ['Chat'],
          summary: 'Paginated chat history (cursor on `before`)',
          parameters: [
            { name: 'appointmentId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'before', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          ],
          responses: { '200': { description: 'OK' } },
        },
      },
      '/symptoms/check': {
        post: {
          tags: ['Symptoms'],
          summary: 'AI symptom analysis (OpenAI with rule-based fallback)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AppointmentCheckSymptom' } } },
          },
          responses: { '201': { description: 'Returns triage assessment + source: openai|rule_based' } },
        },
      },
      '/symptoms/history': {
        get: { tags: ['Symptoms'], summary: 'List previous checks for the user', responses: { '200': { description: 'OK' } } },
      },
      '/notifications': {
        get: { tags: ['Notifications'], summary: 'List in-app notifications', responses: { '200': { description: 'OK' } } },
      },
      '/notifications/register-token': {
        post: { tags: ['Notifications'], summary: 'Register an Expo push token or FCM token', responses: { '200': { description: 'OK' } } },
      },
      '/subscriptions': {
        get: { tags: ['Subscriptions'], summary: "Current user's subscription state + feature limits", responses: { '200': { description: 'OK' } } },
        post: { tags: ['Subscriptions'], summary: 'Upgrade / downgrade plan (free|basic|premium)', responses: { '200': { description: 'OK' } } },
        delete: { tags: ['Subscriptions'], summary: 'Cancel auto-renew', responses: { '200': { description: 'OK' } } },
      },
      '/subscriptions/plans': {
        get: { tags: ['Subscriptions'], summary: 'List plan tiers', responses: { '200': { description: 'OK' } } },
      },
      '/support-tickets': {
        get: { tags: ['Support'], summary: 'List tickets (paginated; admin sees all)', responses: { '200': { description: 'OK' } } },
        post: { tags: ['Support'], summary: 'Create a support ticket', responses: { '201': { description: 'Created' } } },
      },
      '/support-tickets/{id}/messages': {
        post: {
          tags: ['Support'],
          summary: 'Reply to a ticket (owner or admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'OK' } },
        },
      },
      '/admin/system-logs': {
        get: { tags: ['Admin'], summary: 'Paginated audit trail', responses: { '200': { description: 'OK' } } },
      },
    },
  },
  // No JSDoc scanning yet — the paths above are hand-curated. Add globs here
  // when route-level JSDoc annotations are added.
  apis: [],
};

const spec = swaggerJsdoc(options);
export default spec;
