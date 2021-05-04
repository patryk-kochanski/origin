import { ConnectionOptions } from 'typeorm';
import { User } from '@energyweb/origin-backend';

const getDBConnectionOptions = (): ConnectionOptions => {
    return process.env.DATABASE_URL
        ? {
              type: 'postgres',
              url: process.env.DATABASE_URL,
              ssl: {
                  rejectUnauthorized: false
              }
          }
        : {
              type: 'postgres',
              host: process.env.DB_HOST ?? 'localhost',
              port: Number(process.env.DB_PORT) ?? 5432,
              username: process.env.DB_USERNAME ?? 'postgres',
              password: process.env.DB_PASSWORD ?? 'postgres',
              database: process.env.DB_DATABASE ?? 'origin'
          };
};

const config: ConnectionOptions = {
    ...getDBConnectionOptions(),
    entities: ['src/**/*.entity.ts', User],
    synchronize: false,
    migrationsRun: true,
    migrations: ['migrations/*.ts'],
    migrationsTableName: 'migrations_organization_irec',
    cli: {
        migrationsDir: 'migrations'
    }
};

export = config;
