const { Command } = require("discord.js-commando");
const { getUsers } = require("../../nag-state");

class NagUserCommand extends Command {
  constructor(client) {
    super(client, {
      name: "naglist",
      memberName: "naglist",
      group: "daily",
      isOwner: true,
      description: "List nagged users",
    });
  }

  async run(msg) {
    return await msg.reply(
      Array.from(getUsers().values())
        .map((u) => {
          const user = this.client.users.cache.get(u.userId);
          return `${user ? user.username : u.userId} is being nagged at ${
            u.nagTime.hour
          }:${u.nagTime.minute.toString().padStart(2, "0")}.${
            u.paused ? " [Paused]" : ""
          }${
            u.lastLogTime !== 0
              ? " Last logged: " + new Date(u.lastLogTime).toLocaleString('en-RO', {
                timeZone: 'Europe/Bucharest',
              })
              : ""
          }`;
        })
        .join("\n") || "No currently nagged users"
    );
  }
}

module.exports = NagUserCommand;
