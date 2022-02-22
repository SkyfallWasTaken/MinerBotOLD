module.exports = {
	execute: async function(bot, vars) {
		setInterval(() => {
			bot.chat(vars.config.messageToSend);
		}, vars.config.sendInterval);
	}
}