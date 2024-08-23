require("dotenv").config();

const sessionSecret = "mysitesessionsecret";
const emailUser = "saleeque00cr7@gmail.com";
const emailPassword = "wwhninfhurxdhste"


module.exports={
  sessionSecret,
  emailUser,
  emailPassword,
  port: process.env.PORT || 7000,
  mongoDBURL: process.env.MONGO_DB_URL,
}