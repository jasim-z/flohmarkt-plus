FROM node:alpine As development

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm install --frozen-lockfile

COPY . .

RUN npm run build

FROM node:alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}}

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm install --prod --frozen-lockfile

COPY . .
COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/apps/billing/main"]