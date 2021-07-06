const axios = require("axios").default;
const { format, utcToZonedTime } = require("date-fns-tz");

const timeZone = process.env.TIMEZONE || "Europe/Bucharest";

const formatStr = 'yyyy-MM-dd HH:mm:ss'

async function logResponse(userId, userName, answers) {
  if (process.env.NODE_ENV !== "production") {
    console.log("logResponse", userId, userName, answers);
  }

  await axios.post(process.env.LOG_WEBHOOK, {
    command: "appendRow",
    row: [
      format(utcToZonedTime(Date.now(), timeZone), formatStr, { timeZone }),
      userId,
      userName,
      ...answers,
    ],
  });
}

module.exports = {
  logResponse,
};
