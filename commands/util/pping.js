const { Command } = require("discord.js-commando");

class PingCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'pping',
      memberName: 'pping',
      group: 'util',
      description: "Piiiiiing",
    });
  }

  async run(msg) {
    return await msg.reply("Pong!");
  }
}

module.exports = PingCommand;
