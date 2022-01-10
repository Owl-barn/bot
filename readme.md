# Raven
#### epic Discord bot

## Running
- create a postgres database

- create a file called `.env` with the following content:
```
DATABASE_URL="postgresql://{db user}:{db user password}@localhost:5432/{db name}"

DISCORD_TOKEN="{your discord token}"

OWNER_ID="{your discord id}"
EMBED_COLOR="#5c00ff"
EMBED_FAIL_COLOR="#ff0000"

PORT=
NODE_ENV=""

CLIENT_ID=""
CLIENT_SECRET=""
URL=""
JWT_SECRET=""
COOKIETOKEN=""
```

- run the following command initially
```
npm i
npx prisma db push
npx prisma generate
```
then run
```
npx tsc --watch
```
and 
```
npm run start
```
