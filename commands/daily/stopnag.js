const { Command } = require("discord.js-commando");
const { removeUser } = require("../../nag-state");

class StopNagCommand extends Command {
  constructor(client) {
    super(client, {
      name: "stopnag",
      memberName: "stopnag",
      group: "daily",
      description: "Stop nagging a user",
      args: [
        {
          key: "user",
          type: "user",
          prompt: "What user to stop nagging?",
          default: (msg) => msg.author,
        },
      ]
    });
  }

  async run(msg, { user }) {
    if (msg.author.id !== user.id || !this.client.isOwner(msg.author)) {
      return await msg.reply(`Permission denied`)
    }
    removeUser(user.id)
    return await msg.reply(`${user.username} won't be nagged anymore.`)
  }
}

module.exports = StopNagCommand;
