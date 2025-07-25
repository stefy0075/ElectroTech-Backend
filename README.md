# mi-backend

## Descripción

Este es un proyecto de backend llamado "mi-backend" que utiliza Express y Mongoose para manejar las operaciones relacionadas con los usuarios.

## Estructura del Proyecto

```
mi-backend
src/
├── config/
│ ├── db.js
│ ├── swagger.js
│ └── constants.js
├── controllers/
│ └── productController.js
│ └── userController.js #Proximamente
├── models/
│ ├── schemas/
│ │ ├── Product.js
│ │ ├── User.js #Proximamente
│ │ └── index.js
│ ├── Product.js
│ ├── User.js #Proximamente
│ └── index.js
├── monitoring/
│ ├── metricsMiddleware.js
│ └── prometheus.js
├── routes/
│ └── productRoutes.js
│ └── usertRoutes.js #Proximamente
├── scripts/
│ ├──fetchProducts.mjs
│ └──uploadToMongoDB.mjs
├── services/
│ ├── external/
│ │ └── DummyJsonService.js
│ └── ProductService.js
└── utils/
├── asyncHandler.js
├── api/
│ ├── ApiResponse.js
│ └── ApiError.js
└── mappers/
└── productMapper.js
```

## Instalación

1. Clona el repositorio:
   ```
   git clone <URL_DEL_REPOSITORIO>
   ```
2. Navega al directorio del proyecto:
   ```
   cd mi-backend
   ```
3. Instala las dependencias:
   ```
   npm install
   ```

## Uso

1. Crea un archivo `.env` en la raíz del proyecto y configura las variables de entorno necesarias.
2. Para iniciar el servidor en modo desarrollo, ejecuta:
   ```
   npm run dev
   ```
3. Para iniciar el servidor en producción, ejecuta:
   ```
   npm start
   ```

## Rutas

- **POST /api/users**: Crea un nuevo usuario.
- **GET /api/users/:id**: Obtiene un usuario por ID.
- **PUT /api/users/:id**: Actualiza un usuario por ID.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request para discutir cambios.

## Licencia

Este proyecto está bajo la Licencia ISC.

## Tecnologías clave 🛠️

- **Backend**: Node.js 18+ (ES Modules)
- **HTTP Client**: Fetch API nativa (zero-dependencies)
- **Arquitectura**: Servicios separados para consumo de APIs externas

## Migraciones

Si se añaden campos con valores por defecto al modelo Product:

1. Ejecutar el script correspondiente:  
   `node scripts/migrations/initializeActiveField.js`
