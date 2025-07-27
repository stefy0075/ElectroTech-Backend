import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getServerConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    isProduction,
    serverUrl: isProduction
      ? process.env.RENDER_EXTERNAL_URL ||
        `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`
      : process.env.LOCAL_URL,
  };
};

const { isProduction, serverUrl } = getServerConfig();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: process.env.API_TITLE || 'ElectroTech API',
      version: process.env.API_VERSION || '1.0.0',
      description: process.env.API_DESCRIPTION || 'API Documentation',
    },
    servers: [
      {
        url: serverUrl,
        description: isProduction ? 'Production server' : 'Development server',
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
  ],
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  /* **********************************************
     Bloque de seguridad listo para implementación
     ********************************************** */
  if (isProduction) {
    app.use('/api-docs', (req, res, next) => {
      /*
      if (!process.env.SWAGGER_PASSWORD) {
        return res.status(503).json({ 
          error: 'Configuration missing',
          message: 'Swagger access is not configured'
        });
      }
      
      const auth = req.headers.authorization;
      if (!auth || auth !== `Bearer ${process.env.SWAGGER_PASSWORD}`) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Valid API key required'
        });
      }
      */
      next();
    });
  }

  // Servir archivos estáticos con cache-control en producción
  app.use(
    '/swagger-ui-assets',
    express.static(path.join(__dirname, '../../node_modules/swagger-ui-dist'), {
      maxAge: isProduction ? 86400000 : 0,
    })
  );

  // UI de Swagger con configuración adaptable
  app.use('/api-docs', swaggerUi.serve, (req, res) => {
    const html = generateSwaggerHTML();
    res.send(html);
  });

  function generateSwaggerHTML() {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${options.definition.info.title}</title>
        <link rel="stylesheet" href="/swagger-ui-assets/swagger-ui.css">
        <style>
          ${getSecurityStyles()}
          ${getCustomStyles()}
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        ${getSwaggerScripts()}
      </body>
      </html>`;
  }

  function getSecurityStyles() {
    return isProduction
      ? `
      .topbar, .scheme-container, .auth-wrapper { 
        display: none !important 
      }
      .information-container.wrapper {
        padding-top: 20px;
      }
    `
      : '';
  }

  function getCustomStyles() {
    return `
      /* Estilos personalizados para todos los entornos */
      .opblock-summary-path {
        font-weight: 600;
      }
    `;
  }

  function getSwaggerScripts() {
    return `
      <script src="/swagger-ui-assets/swagger-ui-bundle.js"></script>
      <script src="/swagger-ui-assets/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = () => {
          const config = {
            spec: ${JSON.stringify(specs)},
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            layout: "StandaloneLayout",
            deepLinking: true,
            ${getProductionConfig()}
          };
          
          window.ui = SwaggerUIBundle(config);
          ${isProduction ? 'disableAuthButton();' : ''}
        };
        
        ${
          isProduction
            ? `
        function disableAuthButton() {
          setTimeout(() => {
            const authBtn = document.querySelector('.btn.authorize');
            if (authBtn) authBtn.style.display = 'none';
          }, 500);
        }
        `
            : ''
        }
      </script>`;
  }

  function getProductionConfig() {
    return isProduction
      ? `
      docExpansion: 'none',
      defaultModelsExpandDepth: -1,
      displayRequestDuration: true,
      tryItOutEnabled: false
    `
      : '';
  }
};

export default setupSwagger;
