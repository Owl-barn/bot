FROM node:20 AS build
WORKDIR /build/
COPY package.json package-lock.json ./
RUN npm i
COPY . .
RUN npm run compile

FROM node:20 AS prod
WORKDIR /app/
COPY --from=build /build/package.json /build/package-lock.json ./
COPY --from=build /build/ ./
CMD ["npm", "start"]

