# TeamSpeak Automatic Channel Creator
Creates a channel when the existing talk channel as example full is.

# Config

```json
{
    "host": "localhost",
    "port": 10011,
    "serverPort": 9987,
    "user": "serveradmin",
    "pass": "pw",
    "nick": "ChannelCreator"
}
```

I think the configuration is self explaned.

# Groups

```json
[{
    "availableChannels": 3,
    "channelName": "Talk #%number",
    "createChannels": 1,
    "properties": {
        "channel_maxclients": 1,
        "cpid": 2,
        "channel_flag_permanent": 1,
        "channel_flag_maxclients_unlimited": 0,
        "channel_codec_is_unencrypted": 0,
        "channel_codec_quality": 10
    }
}]
```
> availableChannels

The amount of many channel should be empty available

> channelName

The channel name of all channels with the paramenter %number

> properties

the channel parameters from the teamspeak query creation

> createChannels

how many channels should be created if new channels are getting created after a user joins into a channel
