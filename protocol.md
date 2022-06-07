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

### Request

command = `Authenticate`

`userid` is sent, id the bot is already connected to discord.

```ts
{
    password: String;
    userId?: String;
}
```

### Response

Sent by the main bot to confirm that the music sub-bot has authenticated.

Raven-bot also sends a discord token to the sub-bot if the sub-bot is not already connected to discord.

```ts
{
    token?: String;
}
```

## Play

Play a song

command = `Play`

### request:

```ts
{
    channelId: string,
    guildId: string,
    userId: string,
    query: string,
    fore: boolean,
}
```

### response:

```ts
{
    track: Track,
    queueInfo: QueueInfo
}
```

## Stop

Stop playing

command = `Stop`

### request

```ts
{
    guildId: string,
}
```

### response

```ts

```

## Pause

Pause playing if pause is true.
Resume playing if pause is false.
To toggle pause, set pause is not present.

command = `Pause`

### request

```ts
{
    guildId: string,
}
```

### response

```ts
{
    paused: boolean;
}
```

## Skip

Skip to the next song

command = `Skip`

### request

```ts
{
    guildId: string,
    force: boolean,
    index: number,
}
```

### response

```ts

```

## Queue

Get the current queue

command = `Queue`

### request

```ts
{
   guildId: string,
}
```

### response

```ts
{
    queue: Track[],
    current: CurrentSong,
    queueInfo: QueueInfo
}
```

```ts
interface QueueInfo {
    length: number;
    size: number;
    paused: boolean;
    repeat: QueueRepeatMode;
}
```

## Repeat

Repeat the playlist. If repeat is not present, toggle.

command = `Repeat`

### request

```ts
{
    GuildId: string,
    Repeat: QueueRepeatMode
}
```

### response

```ts
{
    Repeat: QueueRepeatMode;
}
```

## Status

Get the current status

command = `Status`

### Response

```ts
{
    upTime: number,
    guilds: {
        id: string,
        channelId?: string,
    }[]
}
```

## Shuffle

Shuffle the queue

```ts
{
    "command": "shuffle",
    "data": {
        "vc": string,
        "guild": string
    }
}
```

## Clear

Clear the queue

```ts
{
    "command": "clear",
    "data": {
        "vc": string,
        "guild": string
    }
}
```

## Remove

Remove a song by string from the queue

```ts
{
    "command": "remove",
    "data": {
        "vc": string,
        "guild": string,
        "song": string
    }
}
```

## Move

Move a song by string in the queue

```ts
{
    "command": "move",
    "data": {
        "vc": string,
        "guild": string,
        "song": string,
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
        "vc": string,
        "guild": string
    }
}
```

### Response

```ts
{
    "command": "list",
    "data": {
        "vc": string,
        "guild": string,
        "songs":
        [
            {
                "id": string,
                "author": String,
                "description": String,
                "duration": String,
                "durationMS": Number,
                "fromPlaylist": String,
                "requestedBy": string,
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
