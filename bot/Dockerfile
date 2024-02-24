FROM node:16-alpine AS build
WORKDIR /build/
COPY package.json package-lock.json ./
RUN npm i
COPY . .
RUN npx prisma generate && npm run compile

FROM node:16-alpine as prod
WORKDIR /app/
COPY --from=build /build/package.json /build/package-lock.json ./
COPY --from=build /build/ ./
EXPOSE 3001
ENTRYPOINT ["sh", "-c", "npx prisma db push && npm start"]
