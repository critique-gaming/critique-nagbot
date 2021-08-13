const { Command } = require("discord.js-commando");
const { setUserPaused } = require("../../nag-state");

class ResumeNagCommand extends Command {
  constructor(client) {
    super(client, {
      name: "resumenag",
      memberName: "resumenag",
      group: "daily",
      description: "Resume nagging a paused user",
      args: [
        {
          key: "user",
          type: "user",
          prompt: "What user to resume nagging?",
          default: (msg) => msg.author,
        },
      ],
    });
  }

  async run(msg, { user }) {
    if (msg.author.id !== user.id && !this.client.isOwner(msg.author)) {
      return await msg.reply(`Permission denied`);
    }
    setUserPaused(user.id, false);
    return await msg.reply(`Nagging resumed for ${user.username}.`);
  }
}

module.exports = ResumeNagCommand;
