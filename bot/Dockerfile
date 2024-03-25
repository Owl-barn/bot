FROM node:18-alpine AS build
WORKDIR /build/
# Install packages
COPY package.json package-lock.json ./
RUN npm i
# Initialise prisma
COPY prisma/schema.prisma prisma/schema.prisma
RUN npx prisma generate
# Copy and compile source code
COPY . .
RUN npm run compile

FROM node:18-alpine as prod
WORKDIR /app/
COPY --from=build /build/package.json /build/package-lock.json ./
COPY --from=build /build/ ./
EXPOSE 3001
ENTRYPOINT ["sh", "-c", "npx prisma db push && npm start"]
