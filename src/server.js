/* @flow */

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import bundle from './bundle';
import logger from './logger';
import config from '../config';

const app = express();

app.use(morgan('tiny'));
app.use(cors());

app.get('/bundle/*', bundle);

app.listen(config.port, () => {
  logger.info(`Ready at http://localhost:${config.port}`);
});
