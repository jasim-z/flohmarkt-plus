# Environment Variables Setup

## Quick Setup for Production

**On EC2, create or update `.env.production` with these values:**

```bash
# Frontend API URLs (with ports)
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3950
NEXT_PUBLIC_API_URL=http://localhost:3953
NEXT_PUBLIC_LISTINGS_API_URL=http://localhost:3952
NEXT_PUBLIC_MESSAGES_API_URL=http://localhost:3954
NEXT_PUBLIC_USERS_API_URL=http://localhost:3950
NEXT_PUBLIC_MESSAGES_WS_URL=http://localhost:3954

# Backend (these are read from secrets in production, but can be here too)
MONGODB_URI=mongodb+srv://jasimzainudheen1_db_user:zXIcXXzxiMZerlvN@flohmarkt-plus-cluster.cjpruvq.mongodb.net/flohmarkt-plus?retryWrites=true&w=majority&?appName=flohmarkt-plus-cluster
JWT_SECRET=7a8B2cD4EfG5H6IjK7Lm8N9O0pQ1R2sT3uV4wX5yZ6Aa7Bb8Cc9Dd0EeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwX

# Node Environment
NODE_ENV=production
```

**Important:** The `docker-compose.prod.yml` reads MongoDB URI and JWT secret from `secrets/` files, but the `.env.production` file is still needed for the `NEXT_PUBLIC_*` variables that the frontend needs.



//

# RABBIT MQ
RABBIT_MQ_URI=amqp://rabbitmq:5672
RABBIT_MQ_AUTH_QUEUE=auth
RABBIT_MQ_BILLING_QUEUE=billing

# JWT
JWT_SECRET=7a8B2cD4EfG5H6IjK7Lm8N9O0pQ1R2sT3uV4wX5yZ6Aa7Bb8Cc9Dd0EeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwX
JWT_EXPIRATION=3600

# MONGO
MONGODB_URI=mongodb://root:password123@mongodb:27017/flohmarkt?authSource=admin

# POSTGRES
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=flohmarkt_plus

# EMAIL SERVICE
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jasimzainudheen1@gmail.com
SMTP_PASS=jjzr wfrc giql cdhm
SMTP_FROM=FlohMarkt+ <noreply@flohmarkt.com>

# SERVICE PORTS
ORDERS_SERVICE_PORT=3949
AUTH_SERVICE_PORT=3950
BILLING_SERVICE_PORT=3951
LISTINGS_SERVICE_PORT=3952
MARKETS_SERVICE_PORT=3953
MESSAGES_SERVICE_PORT=3954

# URLs
FRONTEND_URL=http://localhost:3000
USERS_SERVICE_URL=http://auth:3950

# RABBIT_MQ_URI=amqp://guest:guest@rabbitmq:5672/?heartbeat=30&connection_timeout=30000

#MONGO_PROD=mongodb+srv://jasimzainudheen1_db_user:zXIcXXzxiMZerlvN@flohmarkt-plus-cluster.cjpruvq.mongodb.net/flohmarkt-plus?retryWrites=true&w=majority&?appName=flohmarkt-plus-cluster