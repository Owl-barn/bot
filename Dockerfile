FROM node:16-alpine AS build
WORKDIR /build/
COPY package.json package-lock.json ./
RUN npm i
COPY . .
RUN npm run compile

FROM node:16-alpine as prod
WORKDIR /app/
COPY --from=build /build/package.json /build/package-lock.json ./
COPY --from=build /build/ ./
RUN echo peepee
CMD ["npm", "start"]
