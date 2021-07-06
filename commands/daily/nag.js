const { Command } = require("discord.js-commando");
const { nag } = require("../../nag-state");

class NagCommand extends Command {
  constructor(client) {
    super(client, {
      name: "nag",
      memberName: "nag",
      group: "daily",
      description: "Nag a user right now",
      args: [
        {
          key: "user",
          type: "user",
          prompt: "What user to nag?",
          default: (msg) => msg.author,
        },
      ],
    });
  }

  async run(msg, { user }) {
    if (msg.author.id !== user.id && !this.client.isOwner(msg.author)) {
      return await msg.reply(`Permission denied`);
    }
    nag(user.id);
    return await msg.reply(`${user.username} was nagged`);
  }
}

module.exports = NagCommand;
