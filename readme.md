# Raven bot

This is multi purpose modular discord bot. You are not allowed to use this bot for commercial purposes, or modify it in any way.

## Getting started

-   Create a postgresql database

-   Create a file called `.env` in the root directory and populate it with the example.env content (make sure to remove the inline comments)

-   Run `npm run init` to intiate the environment
-   Run `npx tsc --watch` to compile the code in watch mode
-   Run `npm run start` to start the bot

## Optional Json files:

Add owlet bot accounts to the bot (it always adds the main bot account)

`src/owlets.json`

```json
[
    {
        "id": "",
        "token": ""
    }
]
```

Add customized room names to private room system.

`src/roomNames.json`

```json
{
    "adjectives": ["", ""],
    "nouns": ["", ""]
}
```
