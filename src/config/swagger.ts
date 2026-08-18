import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

// In dev (ts-node), __dirname is src/config — route files are .ts
// In production (compiled), __dirname is dist/config — but JSDoc is in src .ts files
// Always point to src for JSDoc scanning regardless of environment

function toGlob(p: string): string {
  return p.replace(/\\/g, '/');
}

const srcRoot = toGlob(path.join(__dirname, '../../src'));
const apisGlob = [
  `${srcRoot}/modules/**/*.routes.ts`,
  `${srcRoot}/modules/**/*.routes.js`,
];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portfolio API',
      version: '1.0.0',
      description: 'REST API for portfolio website — blogs, projects, contact, about',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
  },
  apis: apisGlob,
};

export const swaggerSpec = swaggerJsdoc(options);
