const {
  Client,
  Events,
  GatewayIntentBits,
  IntentsBitField,
    EmbedBuilder
 
} = require("discord.js");



const squad = new Client({ intents: [GatewayIntentBits.Guilds,  GatewayIntentBits.GuildMessages,
 GatewayIntentBits.MessageContent] });
const SQUAD_CHANNEL_NAME = [
  "",
];
const SQUAD_CODE_LENGTH = 4;
const handleSquadMessage = async (message) => {
  if (message.content.length !== SQUAD_CODE_LENGTH) return;
  const channel = message.channel;
  const squadCode = message.content;
  const prevSquadCode = channel?.topic?.split("#")[1] || "";
  if (prevSquadCode === squadCode.toLocaleUpperCase()) return;
  
  fetch(`https://matchmaking.narrow-one.com/squadExists?id=${squadCode}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.exists) {
        const gameLink = `https://narrow.one/#${squadCode.toUpperCase()}`;
        //channel.setTopic(gameLink);
         message.channel.send(`Set <${gameLink}> as channel topic.`);
       // message.reply(`Set <${gameLink}> as channel topic.`);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};
squad.on("ready", () => {
  console.log(`litchelquadbot is ready!`);
});


squad.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (SQUAD_CHANNEL_NAME.includes(message.channel.name))
    handleSquadMessage(message);
});

squad.login(
  ""
);




