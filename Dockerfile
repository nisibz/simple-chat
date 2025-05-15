FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn

COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npx prisma generate

CMD ["yarn", "dev"]
