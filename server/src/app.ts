import cors from 'cors';
import express, { Application } from 'express';
import { env } from './config/env';
import routes from './routes';

const app: Application = express();

app.use(cors({ origin: env.CLIENT_URLS, credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/v1', routes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

export default app;
