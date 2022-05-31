# Protocol for the music sub-bots

This file defines the protocol for websocket communication between raven-bot and the music sub-bots.

# Message format

Each message contains a message id `mid`, which is copied into any response.

json:

```
{
    "command": String,
    "mid": String,
    "data": {
        String: any
    }
}
```

# Reponses

json:

```
{
    "mid": String,
    "data": {
        Optional error: String,
        Additional data
    }
}
```

# Auth

-   Raven bot uses ssl, and each sub-bot authenticates with the same password.
-   On connect the sub-bot verifies the certificate and sends the `Authenticate` packet if the certificate is valid.
-   Raven bot checks the password and sends the `Authenticated` packet if the password is valid.

# Message types

-   **Authenticate**: Sent by the music sub-bots to authenticate with the main bot.
-   **Authenticated**: Sent by the main bot to confirm that the music sub-bot has authenticated.

-   **play**: Play a song
-   **stop**: Stop playing
-   **pause**: Pause playing with options
-   **skip**: Skip to the next song
-   **queue**: Get the current queue
-   **status**: Get the current status
-   **shuffle**: Shuffles the queue
-   **repeat**: Toggle repeat
-   **clear**: Clear the queue
-   **remove**: Remove a song from the queue
-   **move**: Move a song in the queue
-   **list**: List the songs in the queue

# Packets

## Authenticate

Sent by the music sub-bots to authenticate with the main bot.

```ts
{
    "command": "Authenticate",
    "data": {
        "password": String
    }
}
```

## Authenticated

Sent by the main bot to confirm that the music sub-bot has authenticated.

Raven-bot also sends a discord token to the sub-bot.

```ts
{
    "command": "Authenticated"
    "data": {
        "success": Boolean,
        "token": String
    }
}
```

## Initiated

Sent by the sub-bot to confirm that it has been initiated.

```ts
{
    "command": "Initiated"
    "data": {
        "id": String
    }
}
```

## Play

Play a song

request:

```ts
{
    "command": "play",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake,
        "song": String,
        "user": Snowflake,
    }
}
```

response:

```ts
{
}
```

## Stop

Stop playing

```ts
{
    "command": "stop",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake
    }
}
```

## Pause

Pause playing if pause is true.
Resume playing if pause is false.
To toggle pause, set pause is not present.

```ts
{
    "command": "pause",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake
        "pause": Boolean
    }
}
```

## Skip

Skip to the next song

```ts
{
    "command": "skip",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake
    }
}
```

## Queue

Get the current queue

```ts
{
    "command": "queue",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake
    }
}
```

## Status

Get the current status

```ts
{
    "command": "status",
}
```

### Response

```ts
{
    "command": "status",
    "data": {
        "uptime": Number,
        "guilds":
        [
            {
                "guild": Snowflake,
                Optional "vc": Snowflake,
            }
        ]
    }
}
```

## Shuffle

Shuffle the queue

```ts
{
    "command": "shuffle",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake
    }
}
```

## Repeat

Repeat the playlist. If repeat is not present, toggle.

```ts
{
    "command": "repeat",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake,
        "repeat": Boolean
    }
}
```

## Clear

Clear the queue

```ts
{
    "command": "clear",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake
    }
}
```

## Remove

Remove a song by Snowflake from the queue

```ts
{
    "command": "remove",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake,
        "song": Snowflake
    }
}
```

## Move

Move a song by Snowflake in the queue

```ts
{
    "command": "move",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake,
        "song": Snowflake,
        "index": Number
    }
}
```

## List

Lists all the songs in the queue

```ts
{
    "command": "list",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake
    }
}
```

### Response

```ts
{
    "command": "list",
    "data": {
        "vc": Snowflake,
        "guild": Snowflake,
        "songs":
        [
            {
                "id": Snowflake,
                "author": String,
                "description": String,
                "duration": String,
                "durationMS": Number,
                "fromPlaylist": String,
                "requestedBy": Snowflake,
                "source": String,
                "thumbnail": String,
                "title": String,
                "url": String,
                "views": Number
            }
        ]
    }
}
```
