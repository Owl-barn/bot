# Hootsifer
A modular discord bot with an unique multi-channel music system

## FAQ
 **Is there an official bot?**
> yes, you can invite it [here](https://discord.com/api/oauth2/authorize?client_id=896781020056145931&permissions=8&scope=bot%20applications.commands)

**I cloned the bot and the code isn't there???**
> make sure to use --recursive when cloning to get all submodules

**I've more questions!**
> You can reach us in the [support server](https://discord.gg/UR3sPVEhkd)
## Hosting setup
1. populate the `./owlet/.env` and `./bot/.env` files with the desired variables. (see their respective repos)
1. add the json files that are mentioned in the bot repo to  `./bot/config` (optional)
2. ` docker-compose up -d --scale owlet=X`, X is the amount of bot accounts youve added to `./bot/config/owlets.json` + 1
