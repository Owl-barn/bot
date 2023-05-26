# Hootsifer
Main repository for the Hootsifer project.
use --recursive when cloning to get all submodules
## configuration
1. populate the `./owlet/.env` and `./bot/.env` files with the desired variables. (see their respective repos)
1.1. (optional) add the json files that are mentioned in the bot repo to  `./bot/config`
2. ` docker-compose up -d --scale owlet=X`, X is the amount of bot accounts youve added to `./bot/config/owlets.json` + 1
