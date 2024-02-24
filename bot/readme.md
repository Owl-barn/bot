# Hootsifer

multi purpose modular discord bot.

## Configuration
Populate `.env` file with the desired values, you can see all the available options, default values and descriptions in [`./src/lib/loaders/loadEnvironment.ts`](https://github.com/Owl-barn/bot/blob/main/bot/src/lib/loaders/loadEnvironment%20.ts)


### Owlet bot accounts
Add bot ID and Tokens to this file for the owlets to use (it always uses the main bot account, so you dont have to add it)

`config/owlets.json`

```json
[
    {
        "id": "",
        "token": ""
    }
]
```

### Private room names
Add customized room names to private room system.

`config/roomNames.json`

```json
{
    "adjectives": ["", ""],
    "nouns": ["", ""]
}
```
