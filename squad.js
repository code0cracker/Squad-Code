const {
  Client,
  Events,
  GatewayIntentBits,
  IntentsBitField,
  EmbedBuilder
} = require("discord.js");
const WebSocket = require("ws");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { SlashCommandBuilder } = require("@discordjs/builders");

const token = "";
const clientId = "";
const guildId = "";
const socketUrl = "wss://matchmaking.narrow-one.com"; 

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageTyping,
    
  ]
});

const commands = [
  
  new SlashCommandBuilder()
    .setName('createsquad')
    .setDescription('Create N1 squad code from server')
    .addStringOption(option =>
      option.setName('setting')
        .setDescription('Choose the squad setting')
        .setRequired(true)
        .addChoices(
          { name: 'Public', value: 'public' },
          { name: 'Private', value: 'private' }
        )
    ),
  new SlashCommandBuilder()
    .setName("seasonalgear")
    .setDescription("Get information about events")
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(token);

const versionFetch = async () => {
  try {
    const response = await fetch("https://narrow.one/js/sw.js");
    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    }
    const rawtext = await response.text();
    const VERSION = rawtext.substring(rawtext.search("narrowClient") + 12, rawtext.search("narrowClient") + 22); 
    console.log(VERSION);
    return VERSION;
  } catch (error) {
    console.error('Error fetching version:', error);
    return null;
  }
};

const squadcodepublic = async (VERSION) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(socketUrl);
    ws.on("open", () => {
      ws.send(JSON.stringify({ op: "myClientVersion", version: VERSION }));
      setTimeout(() => {
        ws.send(JSON.stringify({ op: "elo", elo: 100 }));
        setTimeout(() => {
          ws.send(JSON.stringify({ op: "requestSquadId" }));
          setTimeout(() => {
            ws.send(JSON.stringify({ op: "username", username: "Guest 2133" }));
            ws.send(JSON.stringify({ op: "startSquad" }));
          }, 500);
        }, 800);
      }, 500);
    });
    ws.on("message", (data) => {
      try {
        let message = JSON.parse(data);
        if (message.op === "squadId") {
          console.log(message.squadId);
          resolve(message.squadId); 
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        reject(error); 
      }
    });
    ws.on("error", (error) => {
      console.error('WebSocket error:', error);
      reject(error);
    });
    ws.on("close", () => {
      console.log('WebSocket connection closed');
      resolve();
    });
  });
};

const squadcodeprivate = async (VERSION) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(socketUrl);
    ws.on("open", () => {
      ws.send(JSON.stringify({ op: "myClientVersion", version: VERSION }));
      delay(500).then(() => {
        ws.send(JSON.stringify({ op: "elo", elo: 100 }));
        delay(800).then(() => {
          ws.send(JSON.stringify({ op: "requestSquadId" }));
          delay(500).then(() => {
            ws.send(JSON.stringify({ op: "username", username: "Guest 2133" }));
            ws.send(JSON.stringify({ op: "changeSquadSetting", setting: "privateSquad", value: true }));
            ws.send(JSON.stringify({ op: "startSquad" }));
          });
        });
      });
    });
    ws.on("message", (data) => {
      try {
        let message = JSON.parse(data);
        if (message.op === "squadId") {
          console.log(message.squadId);
          resolve(message.squadId); 
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        reject(error); 
      }
    });
    ws.on("error", (error) => {
      console.error('WebSocket error:', error);
      reject(error);
    });
    ws.on("close", () => {
      console.log('WebSocket connection closed');
      resolve();
    });
  });
};

const main = async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }

  const VERSION = await versionFetch();
  if (VERSION) {
    client.login(token);
    client.on(Events.ClientReady, () => {
      console.log(`Ready Logged in as ${client.user.tag}`);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      const { commandName } = interaction;
      if (commandName === "createsquad") {
        const setting = interaction.options.getString('setting');
        if (setting === 'public') {
          try {
            const squadId = await squadcodepublic(VERSION);
            interaction.reply(`Less Go Guy's Join publicSquad \n https://narrow.one/#${squadId}`);
          } catch (error) {
            console.error("Error:", error);
            await interaction.reply({ content: 'Error generating squad code', ephemeral: true });
          }
        } else if (setting === 'private') {
          try {
            const squadId = await squadcodeprivate(VERSION);
            interaction.reply(`Less Go Guy's Join privateSquad \n https://narrow.one/#${squadId}`);
          } catch (error) {
            console.error("Error:", error);
            await interaction.reply({ content: 'Error generating squad code', ephemeral: true });
          }
        }
      }
    });
  }
};

main();
