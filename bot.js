const config = require("./config.json");

const mineflayer = require("mineflayer");
const mineflayerViewer = require('prismarine-viewer').mineflayer
const fs = require("fs");
const { Client, Collection, Intents } = require("discord.js");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"));
const handlerFiles = fs
	.readdirSync("./handlers")
	.filter((file) => file.endsWith(".js"));
let handlers = []

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}
for (const file of handlerFiles) {
	const command = require(`./handlers/${file}`);
	handlers.push(command)
	console.log("Registered handler:", file)
}

let bot;
let isBotReady = false;
let vars = {
    chatChannel: undefined,
    serverInfoChannel: undefined,
    config: config
};
function createBot() {
    bot = mineflayer.createBot({
		host: config.host,
		username: config.authentication.email,
		password: config.authentication.password,
		auth: "mojang",
	});
    isBotReady = true;
	handlers.forEach(handler => {
		handler.execute(bot, vars)
	})
	bot.once("spawn", () => {
		mineflayerViewer(bot, { port: 4200 })
	})
    bot.on("kicked", (reason) => {
		isBotReady = false;
		vars.chatChannel.send(`:x: Got kicked from server, reason: ${reason}`);
		createBot()
        isBotReady = true
		vars.chatChannel.send(`:negative_squared_cross_mark: Rejoined successfully!`);
	});
	bot.on("error", (reason) => {
		isBotReady = false;
		vars.chatChannel.send(`:x: Error, reason: ${reason}`);
        createBot()
		isBotReady = true;
		vars.chatChannel.send(`:negative_squared_cross_mark: Rejoined successfully!`);
	});
}
client.once("ready", () => {
	vars.chatChannel = client.channels.cache.get(config.discord.chatChannelId);
	vars.serverInfoChannel = client.channels.cache.get(
		config.discord.serverInfoChannelId
	);
	if (!vars.chatChannel.isText()) throw new Error("Chat channel not text!");
	if (!vars.serverInfoChannel.isText())
		throw new Error("server info channel not text!");
	bot = mineflayer.createBot({
		host: config.host,
		username: config.authentication.email,
		password: config.authentication.password,
		auth: "mojang",
	});
	isBotReady = true;
	let messageInterval = setInterval(() => {
		bot.chat(config.messageToSend);
	}, config.sendInterval);
	
	bot.on("kicked", (reason) => {
		isBotReady = false;
		clearInterval(messageInterval);
		vars.chatChannel.send(`:x: Got kicked from server, reason: ${reason}`);
		bot = mineflayer.createBot({
			host: config.host,
			username: config.authentication.email,
			password: config.authentication.password,
			auth: "mojang",
		});
		global.bot = bot;
		isBotReady = true;
		messageInterval = setInterval(() => {
			bot.chat(config.messageToSend);
		}, config.sendInterval);
		vars.chatChannel.send(`:negative_squared_cross_mark: Rejoined successfully!`);
	});
	bot.on("error", (reason) => {
		isBotReady = false;
		clearInterval(messageInterval);
		vars.chatChannel.send(`:x: Error, reason: ${reason}`);
		bot = mineflayer.createBot({
			host: config.host,
			username: config.authentication.email,
			password: config.authentication.password,
			auth: "mojang",
		});
		global.bot = bot;
		isBotReady = true;
		messageInterval = setInterval(() => {
			bot.chat(config.messageToSend);
		}, config.sendInterval);
		vars.chatChannel.send(`:negative_squared_cross_mark: Rejoined successfully!`);
	});
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;
	if (!isBotReady) {
		return interaction.reply({
			content: "There was an error while executing this command!",
			ephemeral: true,
		});
	}

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction, bot);
	} catch (error) {
		console.error(error);
		return interaction.reply({
			content: "There was an error while executing this command!",
			ephemeral: true,
		});
	}
});

client.login(config.discord.token);
