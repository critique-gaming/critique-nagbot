const { Command } = require("discord.js-commando");
const { addUser } = require("../../nag-state");

class NagMeCommand extends Command {
  constructor(client) {
    super(client, {
      name: "nagme",
      memberName: "nagme",
      group: "daily",
      description: "Nag me if I don't log daily",
      args: [
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
      ],
    });
  }

  async run(msg, { hour, minute }) {
    addUser(msg.author.id, hour, minute);
    return await msg.reply(
      `You will be nagged every work day at ${hour}:${minute
        .toString()
        .padStart(2, "0")}`
    );
  }
}

module.exports = NagMeCommand;
