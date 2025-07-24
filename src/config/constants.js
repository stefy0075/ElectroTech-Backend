export const API_DEFAULTS = {
  LIMIT: 20,
  MAX_LIMIT: 100,
  OFFSET: 0,
};

export const PRODUCT_CATEGORIES = [
  'smartphones',
  'laptops',
  'tablets',
  'mens-watches',
  'womens-watches',
  'mobile-accessories',
  'motorcycle',
];

export const ERROR_MESSAGES = {
  DB_CONNECTION: 'Error al conectar con la base de datos',
  INVALID_DATA: 'Datos de entrada inválidos',
  NOT_FOUND: 'Recurso no encontrado',
};

export const HTTP_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

export const SWAGGER_OPTIONS = {
  customSiteTitle: 'ElectroTech API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
  customfavIcon: '/assets/favicon.ico',
};

export const METRICS_ENABLED = process.env.METRICS_ENABLED === 'true';
