FROM node:alpine As builder

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm@9
RUN pnpm install --frozen-lockfile

COPY . .

RUN npx nest build listings

FROM node:alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm@9
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist

CMD ["node", "dist/apps/listings/main"]