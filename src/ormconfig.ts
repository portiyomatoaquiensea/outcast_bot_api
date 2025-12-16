// ormconfig.ts
import * as dotenv from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

dotenv.config();
const dwConnection: TypeOrmModuleOptions = {
  ssl: process.env.DB_SSL_DTAPL === 'true' ? {
    rejectUnauthorized: true
  } : false,
  name: process.env.CONN_DTAPL_NAME,
  type: 'postgres',
  host: process.env.DB_HOST_DTAPL || 'localhost',
  port: parseInt(process.env.DB_PORT_DTAPL, 10) || 5432,
  username: process.env.DB_USERNAME_DTAPL || 'postgres',
  password: process.env.DB_PASSWORD_DTAPL || '123456',
  database: process.env.DB_NAME_DTAPL || 'player_dw',
  entities: [
    
  ],
  // synchronize: process.env.DB_SYNCHRONIZE_DTAPL === 'true' || false, // true for generate new table
  // logging: process.env.DB_LOGGING_DTAPL === 'true' || false,
};

const realTimeConnection: TypeOrmModuleOptions = {
  ssl: process.env.DB_SSL_REALTIME === 'true' ? {
    rejectUnauthorized: true
  } : false,
  name: process.env.CONN_REALTIME_NAME,
  type: 'postgres',
  host: process.env.DB_HOST_REALTIME || 'localhost',
  port: parseInt(process.env.DB_PORT_REALTIME, 10) || 5432,
  username: process.env.DB_USERNAME_REALTIME || 'postgres',
  password: process.env.DB_PASSWORD_REALTIME || '123456',
  database: process.env.DB_NAME_REALTIME || 'postgres',
  entities: [
    
  ],
  // synchronize: process.env.DB_SYNCHRONIZE_REALTIME === 'true' || false, // true for generate new table
  // logging: process.env.DB_LOGGING_REALTIME === 'true' || false,
};


export {
  dwConnection,
  realTimeConnection
};
