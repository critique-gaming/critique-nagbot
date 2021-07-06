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

async function emojiPrompt(message, author) {
  await message.react(positiveReaction);
  await message.react(negativeReaction);

  const reactionFilter = (reaction, user) => {
    return (
      [positiveReaction, negativeReaction].includes(reaction.emoji.name) &&
      user.id === author.id
    );
  };
  const reaction = (
    await message.awaitReactions(reactionFilter, {
      max: 1,
      time: 60000,
      errors: ["time"],
    })
  ).first();

  return reaction.emoji.name === positiveReaction
}

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
      if (!await emojiPrompt(finalMessage, msg.author)) {
        return await msg.author.send("You cancelled your response and it will not be recorded.")
      }
    } catch (ex) {
      return await msg.author.send("Your response timed out.")
    } finally {
      this.client.dispatcher.removeInhibitor(inhibitor);
    }

    await logResponse(msg.author.id, msg.author.username, questions.map(q => replies[q.id]))
    kickWatchdog(msg.author.id)

    if (msg.channel.type !== "dm") {
      const publicAsk = await msg.author.send("Thanks! Your response has been recorded! Would you like to post this publicly?")
      if (await emojiPrompt(publicAsk, msg.author)) {
        await msg.channel.send(`${msg.author.username} just logged their day:\n${questions
          .map((q) => `**${q.label}**: ${replies[q.id]}`)
          .join("\n")}`
        );
      }
    } else {
      await msg.author.send("Thanks! Your response has been recorded!")
    }
  }
}

module.exports = PingCommand;
