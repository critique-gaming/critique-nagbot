const { Command } = require("discord.js-commando");
const { logResponse } = require("../../sheets-logger");
const { kickWatchdog, getChannelId } = require("../../nag-state");

const trueFilter = () => true;

const positiveReaction = "✅";
const negativeReaction = "❌";
const silentReaction = "🙈";

const questions = [
  {
    id: "review",
    label: "📈 Raport",
    text: "Cum a mers ce ți-ai propus să obții de data trecută?",
  },
  {
    id: "satisfaction",
    label: "👀 Satisfacție",
    text: " Între 1 și 5, cât de satisfăcut ești cu munca ta? ",
    validate: (x) => {
      const n = parseInt(x, 10);
      return n >= 1 && n <= 5;
    },
    parse: parseInt,
  },
  {
    id: "goal",
    label: "🏆 Țel",
    text: "Ce îți propui să obții până data viitoare?",
  },
];

async function emojiPrompt(message, author, options) {
  options = options || [
    { react: positiveReaction, value: true },
    { react: negativeReaction, value: false }
  ];

  const reacts = options.map(x => x.react);

  for (let option of options) {
    await message.react(option.react);
  }

  const reactionFilter = (reaction, user) => (
    reacts.includes(reaction.emoji.name) && user.id === author.id
  );
  const reaction = (
    await message.awaitReactions(reactionFilter, {
      max: 1,
      time: 60000,
      errors: ["time"],
    })
  ).first();

  return options.find(option => option.react === reaction.emoji.name).value
}

class PingCommand extends Command {
  constructor(client) {
    super(client, {
      name: "raport",
      aliases: ["log"],
      memberName: "raport",
      group: "daily",
      description: "Log your day",
    });
  }

  async run(msg) {
    const inhibitor = (message) =>
      message.author.id === msg.author.id &&
      message.channel.type === "dm" &&
      "Answers to form";

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

      let channelId = getChannelId();
      let channel = channelId && this.client.channels.cache.get(channelId);

      const options = channel ? [
        { react: positiveReaction, value: true, desc: "Da, să trăiți!" },
        { react: silentReaction, value: "silent", desc: "Da, dar nu spuneți la restul unității." },
        { react: negativeReaction, value: false, desc: "Nu e bine. Am greșit, Dn-a Colonel!" },
      ] : [
        { react: positiveReaction, value: "silent", desc: "Da, să trăiți! Aș zice și la unitate, dar ceva nu merge" },
        { react: negativeReaction, value: false, desc: "Nu e bine. Am greșit, Dn-a Colonel!" },
      ];

      const finalMessage = await msg.author.send(
        `**Am luat bine la cunoștiință?**\n${questions
          .map((q) => `**${q.label}**: ${replies[q.id]}`)
          .join("\n")}\n\n**Răspunde cu:**\n${options.map(o => `${o.react} ${o.desc}`).join("\n")}`
      );
      const result = await emojiPrompt(finalMessage, msg.author, options);

      if (result === false) {
        return await msg.author.send(
          "Ți-ai anulat raportul și nu va fi înregistrat."
        );
      }

      await logResponse(
        msg.author.id,
        msg.author.username,
        questions.map((q) => replies[q.id])
      );
      kickWatchdog(msg.author.id);

      if (result === "silent") {
        return await msg.author.send("Să trăiești, soldat! Raportul tău a fost înregistrat și nu a fost împărtășit cu restul unității!");
      }

      if (result === true) {
        channelId = getChannelId();
        channel = channelId && this.client.channels.cache.get(channelId);

        await channel.send(
          `**${msg.author.username}** tocmai a fost prezent la raport:\n${questions
            .map((q) => `**${q.label}**: ${replies[q.id]}`)
            .join("\n")}`
        );

        return await msg.author.send("Să trăiești, soldat! Raportul tău a fost înregistrat!");
      }
    } catch (ex) {
      return await msg.author.send("Ai fost prea leneș, soldat!");
    } finally {
      this.client.dispatcher.removeInhibitor(inhibitor);
    }
  }
}

module.exports = PingCommand;
