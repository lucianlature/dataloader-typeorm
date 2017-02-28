import typeorm from 'typeorm';
import {
    resetCache
} from '../src';
import User from './entity/UserSchema';

beforeEach(resetCache);


export const createConnection = () => {
  const {TYPE, DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE} = process.env;
  const driverOptions = {
    type: TYPE || 'postgres',
    port: 5432,
    host: DB_HOST,
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE
  };

  return typeorm.createConnection({
    driver: driverOptions,
    entitySchemas: [User],
    autoSchemaSync: true,
    logging: {
      logQueries: false,
      logFailedQueryError: true,
    }
  })
  .catch((error) => {
    console.error('===> Error: ', error);
  });
};

export const randint = (min = 1, max = 10000) => Math.floor(Math.random() * (max - min + 1)) + min;
