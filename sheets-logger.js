async function logResponse(userId, userName, answers) {
  if (process.env.NODE_ENV !== "production") {
    console.log("logResponse", userId, userName, answers);
  }
}

module.exports = {
  logResponse,
}
