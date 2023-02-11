const cron = require("node-cron");
const fs = require("fs/promises");
const path = require("path");

const timeZone = process.env.TIMEZONE || "Europe/Bucharest";
const saveFile = process.env.SAVE_FILE || path.join(__dirname, "db.json");

const state = new Map();
let client;
let channelId;

function nag(userId) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`Nagging ${userId}...`);
  }
  if (!client) return;
  const user = client.users.cache.get(userId);
  if (!user) return;
  user.send("Salutare, soldat! Nu uita să-mi dai `?raport`-ul!");
}

async function setClient(client_) {
  client = client_;
  await load();
}

function kickWatchdog(userId) {
  const userData = state.get(userId);
  if (!userData) return;
  userData.lastLogTime = Date.now();
}

function updateCron(userData) {
  if (userData.task) userData.task.stop();
  if (!userData.nagTime) return;
  const { minute, hour } = userData.nagTime;
  userData.task = cron.schedule(
    `${minute} ${hour} * * 1,2,3,4,5`,
    () => {
      if (userData.paused) return;
      if (Date.now() - userData.lastLogTime < 1000 * 60 * 60 * 18) return;
      nag(userData.userId);
    },
    { timezone: timeZone }
  );
}

function addUser(userId, hour, minute, noOverride) {
  let userData = state.get(userId);
  if (!userData) {
    userData = {
      userId,
      lastLogTime: 0,
      paused: false,
      nagTime: null,
      task: null,
    };
    state.set(userId, userData);
  } else if (noOverride) {
    return;
  }
  userData.nagTime = { hour, minute };
  updateCron(userData);
  save();
}

function removeUser(userId) {
  let userData = state.get(userId);
  if (!userData) return;
  if (userData.task) userData.task.stop();
  state.delete(userId);
  save();
}

function setUserPaused(userId, paused) {
  let userData = state.get(userId);
  if (!userData) return;
  userData.paused = paused;
  save();
}

function getUsers() {
  return state;
}

function setChannelId(channelId_) {
  channelId = channelId_;
  save();
}

function getChannelId() {
  return channelId;
}

async function save() {
  const data = {
    naggedUsers: Array.from(state.values()).map((v) => ({ ...v, task: null })),
    nagChannelId: channelId,
  };
  await fs.writeFile(saveFile, JSON.stringify(data, null, 2), "utf8");
}

async function load() {
  let data;
  try {
    data = JSON.parse(await fs.readFile(saveFile, "utf8"));
  } catch (ex) {}
  if (!data) return;

  channelId = data.nagChannelId;
  data.naggedUsers.forEach((user) => {
    state.set(user.userId, user);
    updateCron(user);
  });
}

module.exports = {
  setClient,
  addUser,
  removeUser,
  setUserPaused,
  kickWatchdog,
  nag,
  getUsers,
  setChannelId,
  getChannelId,
};
