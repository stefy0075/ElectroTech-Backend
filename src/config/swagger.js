import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ElectroTech API',
      version: '1.0.0',
      description: 'API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local server',
      },
    ],
  },
  apis: [path.join(__dirname, '../controllers/*.js')],
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  // Servir archivos estáticos desde el módulo
  const swaggerAssets = express.static(
    path.join(__dirname, '../../node_modules/swagger-ui-dist')
  );

  app.use('/swagger-ui', swaggerAssets);

  // Configurar la UI de Swagger
  app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>ElectroTech API Docs</title>
        <link rel="stylesheet" href="/swagger-ui/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="/swagger-ui/swagger-ui-bundle.js"></script>
        <script src="/swagger-ui/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = () => {
            window.ui = SwaggerUIBundle({
              spec: ${JSON.stringify(specs)},
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              layout: "StandaloneLayout"
            });
          };
        </script>
      </body>
      </html>
    `;
    res.send(html);
  });
};

export default setupSwagger;
