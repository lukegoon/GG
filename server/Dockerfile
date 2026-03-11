FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/ .
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "start"]
