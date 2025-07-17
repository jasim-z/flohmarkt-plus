import * as fs from 'fs';

export function loadConfig() {
    return {
        MONGODB_URI: process.env.MONGODB_URI || fs.readFileSync('/run/secrets/mongodb_uri', 'utf8').trim(),
        JWT_SECRET: process.env.JWT_SECRET || fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim(),
        JWT_EXPIRATION: process.env.JWT_EXPIRATION,
        RABBIT_MQ_URI: process.env.RABBIT_MQ_URI,
        RABBIT_MQ_AUTH_QUEUE: process.env.RABBIT_MQ_AUTH_QUEUE,
        RABBIT_MQ_BILLING_QUEUE: process.env.RABBIT_MQ_BILLING_QUEUE,
    };
}