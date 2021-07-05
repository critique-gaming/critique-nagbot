const { Command } = require("discord.js-commando");
const { logResponse } = require("../../sheets-logger");
const { kickWatchdog } = require("../../nag-state");

const trueFilter = () => true;

const positiveReaction = "✅";
const negativeReaction = "❌";

const questions = [
  {
    id: "review",
    label: "Review",
    text: "Cum a mers ce ți-ai propus să obții de data trecută?",
  },
  {
    id: "satisfaction",
    label: "Satisfaction",
    text: " Între 1 și 5, cât de satisfăcut ești cu munca ta? ",
    validate: (x) => {
      const n = parseInt(x, 10);
      return n >= 1 && n <= 5;
    },
    parse: parseInt,
  },
  {
    id: "goal",
    label: "Goal",
    text: "Ce îți propui să obții până data viitoare?",
  },
];

class PingCommand extends Command {
  constructor(client) {
    super(client, {
      name: "log",
      memberName: "log",
      group: "daily",
      description: "Log your day",
    });
  }

  async run(msg) {
    const inhibitor = (message) =>
      message.author.id === msg.author.id && message.channel.type === "dm" && "Answers to form";

    let replies = {};

    this.client.dispatcher.addInhibitor(inhibitor);
    try {
      for (let question of questions) {
        let reply;
        do {
          await msg.author.send(question.text);
          reply = (
            await msg.author.dmChannel.awaitMessages(trueFilter, {
              max: 1,
              time: 10 * 60 * 1000,
              errors: ["time"],
            })
          ).first();
        } while (
          !(question.validate ? question.validate(reply.content) : true)
        );

        replies[question.id] = question.parse
          ? question.parse(reply.content)
          : reply.content;
      }

      const finalMessage = await msg.author.send(
        `**Is this correct?**\n${questions
          .map((q) => `**${q.label}**: ${replies[q.id]}`)
          .join("\n")}`
      );
      await finalMessage.react(positiveReaction);
      await finalMessage.react(negativeReaction);

      const reactionFilter = (reaction, user) => {
        return (
          [positiveReaction, negativeReaction].includes(reaction.emoji.name) &&
          user.id === msg.author.id
        );
      };
      const reaction = (
        await finalMessage.awaitReactions(reactionFilter, {
          max: 1,
          time: 60000,
          errors: ["time"],
        })
      ).first();

      if (reaction.emoji.name === negativeReaction) {
        return await msg.author.send("You cancelled your response and it will not be recorded.")
      }
    } catch (ex) {
      return await msg.author.send("Your response timed out.")
    } finally {
      this.client.dispatcher.removeInhibitor(inhibitor);
    }

    await logResponse(msg.author.id, msg.author.username, replies)
    kickWatchdog(msg.author.id)

    return await msg.author.send("Thanks! Your response has been recorded!")
  }
}

module.exports = PingCommand;
