FROM node:16-alpine AS builder

WORKDIR /source

COPY ./package* .
RUN npm install

COPY . .
RUN npm run build

FROM node:16-alpine AS production

WORKDIR /source

COPY --from=builder /source/dist ./dist
COPY --from=builder /source/node_modules ./node_modules
COPY --from=builder /source/package.json .
COPY --from=builder /source/src/index.html ./dist/index.html

CMD [ "node", "dist/app.js" ]
