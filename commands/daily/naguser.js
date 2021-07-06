const { Command } = require("discord.js-commando");
const { addUser } = require("../../nag-state");

class NagUserCommand extends Command {
  constructor(client) {
    super(client, {
      name: "naguser",
      memberName: "naguser",
      group: "daily",
      description: "Nag a user if they don't log daily",
      args: [
        {
          key: "user",
          type: "user",
          prompt: "What user to nag?",
          default: (msg) => msg.author,
        },
        {
          key: "hour",
          type: "integer",
          prompt: "At what hour should I nag you?",
          min: 0,
          max: 23,
          default: 19,
        },
        {
          key: "minute",
          prompt: "At what minute should I nag you?",
          type: "integer",
          min: 0,
          max: 59,
          default: 0,
        },
      ]
    });
  }

  async run(msg, { user, hour, minute }) {
    if (msg.author.id !== user.id && !this.client.isOwner(user)) {
      return await msg.reply(`Permission denied`)
    }
    addUser(user.id, hour, minute)
    return await msg.reply(`${user.username} will be nagged every work day at ${hour}:${minute.toString().padStart(2, '0')}`)
  }
}

module.exports = NagUserCommand;
