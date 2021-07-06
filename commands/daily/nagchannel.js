const { Command } = require("discord.js-commando");
const { setChannelId } = require("../../nag-state");

class NagChannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'nagchannel',
      memberName: 'nagchannel',
      group: 'util',
      description: "Sets the channel where to post public logs",
      isOwner: true,
      args: [
        {
          key: "channel",
          type: "channel",
          prompt: "What channel to post to?",
          default: (msg) => msg.channel,
        },
      ]
    });
  }

  async run(msg, { channel }) {
    setChannelId(channel.id)
    return await msg.reply(`Will now send logs to channel ${channel.id}`);
  }
}

module.exports = NagChannelCommand;
