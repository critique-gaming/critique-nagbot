const cron = require("node-cron")

const timeZone = process.env.TIMEZONE || "Europe/Bucharest";

const state = new Map();
let client

function nag(userId) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`Nagging ${userId}...`)
  }
  if (!client) return
  const user = client.users.cache.get(userId)
  if (!user) return
  user.send("Hey! Don't forget to ?log")
}

function setClient(client_) {
  client = client_
}

function kickWatchdog(userId) {
  const userData = state.get(userId)
  if (!userData) return
  userData.lastLogTime = Date.now()
}

function addUser(userId, hour, minute, noOverride) {
  let userData = state.get(userId)
  if (!userData) {
    userData = {
      userId,
      lastLogTime: 0,
      paused: false,
      nagTime: null,
      task: null,
    }
    state.set(userId, userData)
  } else if (noOverride) {
    return;
  }
  userData.nagTime = { hour, minute }

  if (userData.task) userData.task.stop()
  userData.task = cron.schedule(`${minute} ${hour} * * 0,1,2,3,4,5`, () => {
    if (userData.paused) return
    if (Date.now() - userData.lastLogTime < 1000 * 60 * 60 * 23) return
    nag(userData.userId)
  }, { timezone: timeZone })
}

function removeUser(userId) {
  let userData = state.get(userId)
  if (!userData) return
  if (userData.task) userData.task.stop()
  userData.delete(userId)
}

function setUserPaused(userId, paused) {
  let userData = state.get(userId)
  if (!userData) return
  userData.paused = paused
}

function getUsers() {
  return state
}

module.exports = {
  setClient,
  addUser,
  removeUser,
  setUserPaused,
  kickWatchdog,
  nag,
  getUsers,
}
