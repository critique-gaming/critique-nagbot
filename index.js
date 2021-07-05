#!/usr/bin/env node
require("dotenv").config();

const path = require("path");
const Commando = require("discord.js-commando");

const nagState = require("./nag-state")

const client = new Commando.Client({
  commandPrefix: "?",
  ownerID: process.env.DISCORD_BOT_OWNER_ID,
});

client.registry
    .registerGroups([
      ["daily", "Daily report commands"]
    ])
    .registerDefaults()
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.login(process.env.DISCORD_BOT_TOKEN);

nagState.setClient(client)
