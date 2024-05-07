FROM node:20-alpine AS build
WORKDIR /build/
RUN apk add g++ make py3-pip
COPY package.json package-lock.json ./
RUN npm i
COPY . .
RUN npm run compile

FROM node:20-alpine as prod
WORKDIR /app/
COPY --from=build /build/package.json /build/package-lock.json ./
COPY --from=build /build/ ./
CMD ["npm", "start"]
