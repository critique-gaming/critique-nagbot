const { Command } = require("discord.js-commando");
const { setUserPaused } = require("../../nag-state");

class PauseNagCommand extends Command {
  constructor(client) {
    super(client, {
      name: "pausenag",
      memberName: "pausenag",
      group: "daily",
      description: "Pause nagging a user temporarily (holiday?)",
      args: [
        {
          key: "user",
          type: "user",
          prompt: "What user to pause nagging?",
          default: (msg) => msg.author,
        },
      ]
    });
  }

  async run(msg, { user }) {
    if (msg.author.id !== user.id || !this.client.isOwner(user)) {
      return await msg.reply(`Permission denied`)
    }
    setUserPaused(user.id, true)
    return await msg.reply(`Nagging paused for ${user.username}.`)
  }
}

module.exports = PauseNagCommand;
