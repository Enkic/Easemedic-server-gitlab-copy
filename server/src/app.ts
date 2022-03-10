import express from 'express';
// import expressPrometheus from 'express-prometheus-middleware';
import expressStatusMonitor from 'express-status-monitor';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';

import { handleServerErrorResponse } from './middlewares';
import { refresh_finess } from './finess_refresh';

import user from './routes/user';
import prescription from './routes/prescription';
import pharmacies from './routes/pharmacy';
import tokens from './routes/oauth';
import oauthServices from './routes/oauthServices';
import order from './routes/order';
import reminders from './routes/reminder';

export const app = express();

refresh_finess();

app.use(
    morgan(
        ':remote-addr - :remote-user [:date[clf]] :method :url :status :response-time ms'
    )
);
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(express.json({ limit: '100mb' }));
app.use(expressStatusMonitor()); //http://localhost:8080/status
// app.use(expressPrometheus({
//     metricsPath: '/metrics',
//     collectDefaultMetrics: true,
//     requestDurationBuckets: [0.1, 0.5, 1, 1.5],
//     requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
//     responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
//  }));

app.use('/', user);
app.use('/', prescription);
app.use('/', pharmacies);
app.use('/', tokens);
app.use('/', oauthServices);
app.use('/', order);
app.use('/', reminders);

app.get('/', (req, res) => {
    res.send('Api is UP');
});

app.use(handleServerErrorResponse);
