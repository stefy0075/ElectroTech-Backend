import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import userRoutes from './src/routes/userRoutes.js';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to mi-backend API');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
