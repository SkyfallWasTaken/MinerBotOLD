const config = require("./config.json");

const mineflayer = require("mineflayer");
const fs = require("fs");
const { Client, Collection, Intents } = require("discord.js");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"));
const handlerFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}
for (const file of handlerFiles) {
	const command = require(`./handlers/${file}`);
}

let bot;
let isBotReady = false;
client.once("ready", () => {
	const chatChannel = client.channels.cache.get(config.discord.chatChannelId);
	const serverInfoChannel = client.channels.cache.get(
		config.discord.serverInfoChannelId
	);
	if (!chatChannel.isText()) throw new Error("Chat channel not text!");
	if (!serverInfoChannel.isText())
		throw new Error("server info channel not text!");
	bot = mineflayer.createBot({
		host: config.host,
		username: config.authentication.email,
		password: config.authentication.password,
		auth: "mojang",
	});
	global.bot = bot;
	isBotReady = true;
	let messageInterval = setInterval(() => {
		bot.chat(config.messageToSend);
	}, config.sendInterval);
	bot.on("chat", (username, message) => {
		chatChannel.send(`**${username}:** ${message}`);
	});
	bot.on("kicked", (reason) => {
		isBotReady = false;
		clearInterval(messageInterval);
		chatChannel.send(`:x: Got kicked from server, reason: ${reason}`);
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
		chatChannel.send(`:negative_squared_cross_mark: Rejoined successfully!`);
	});
	bot.on("error", (reason) => {
		isBotReady = false;
		clearInterval(messageInterval);
		chatChannel.send(`:x: Error, reason: ${reason}`);
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
		chatChannel.send(`:negative_squared_cross_mark: Rejoined successfully!`);
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
