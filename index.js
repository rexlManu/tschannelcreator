const chalk = require('chalk');
const config = require('./config');
const groups = require('./groups');

const { TeamSpeak, QueryProtocol, TextMessageTargetMode, ChannelEdit, Codec } = require("ts3-nodejs-library")
const channels = [];
const error = (error) => console.log(chalk.red(error));
const currentChannel = [];

TeamSpeak.connect({
    host: config.host,
    queryport: config.port,
    nickname: config.nick,
    username: config.user,
    password: config.pass,
    serverport: config.serverPort
}).then(teamSpeak => {
    console.log(chalk.cyan('[Query]'), chalk.green('Successful connected to server.'));

    teamSpeak.clientList({ client_type: 0 }).then(clients => {
        clients.forEach(client => {
            currentChannel[client.uniqueIdentifier] = client.cid;
        })
    })

    Promise.all([
        teamSpeak.registerEvent("server"),
        teamSpeak.registerEvent("channel", 0),
        teamSpeak.registerEvent("textserver"),
        teamSpeak.registerEvent("textchannel"),
        teamSpeak.registerEvent("textprivate")
    ]).then(() => {
        groups.forEach(group => {
            teamSpeak.channelList({ pid: group.properties.cpid }).then(async cs => {
                var element = { group, channels: [] };
                cs.forEach(channel => {
                    element.channels.push(channel);
                });
                for (let i = element.channels.length; i < group.availableChannels; i++) {
                    element.channels.push(await teamSpeak.channelCreate(group.channelName.replace("%number", i + 1), group.properties));
                }
                channels.push(element);
            }).catch(error);
        })

        teamSpeak.on('clientmoved', async event => {

            var element = channels.filter(v => {
                return v.channels.filter(x => x.cid === event.client.cid)[0]
            })[0];
            if (!element) {
                element = channels.filter(v => {
                    return v.channels.filter(x => x.cid === currentChannel[event.client.uniqueIdentifier])[0]
                })[0];
                if (!element) return;
                if (element.channels.length - 2 < 0) return;
                if (element.channels.length <= element.group.availableChannels) return;
                var lastChannelsEmpty = true;
                for (let i = element.channels.length - 2; i < element.channels.length; i++) {
                    if (!await channelEmpty(element.channels[i].cid)) {
                        lastChannelsEmpty = false;
                    }
                }
                if (lastChannelsEmpty) {
                    await teamSpeak.channelDelete(element.channels.pop().cid);
                }
                return;
            }
            var allChannelFull = true;

            for (const c of element.channels) {
                if (!await channelFull(c.cid)) {
                    allChannelFull = false;
                }
            }

            if (allChannelFull) {
                for (let i = 0; i < 2; i++) {
                    var channel = await teamSpeak.channelCreate(element.group.channelName.replace("%number", element.channels.length + 1), element.group.properties)
                    element.channels.push(channel);
                }
            }
        })

        teamSpeak.on("clientconnect", event => {
            currentChannel[event.client.uniqueIdentifier] = event.client.cid;
        })
        teamSpeak.on('clientmoved', event => {
            if (currentChannel[event.client.uniqueIdentifier] === event.channel.cid) return;
            currentChannel[event.client.uniqueIdentifier] = event.channel.cid;
        })
    });

    async function channelFull(cid) {
        var channel = await teamSpeak.getChannelByID(cid);
        return channel.maxclients == -1 ? channel.totalClients != 0 : channel.totalClients >= channel.maxclients;
    }

    async function channelEmpty(cid) {
        var channel = await teamSpeak.getChannelByID(cid);
        return channel.totalClients === 0;
    }
});