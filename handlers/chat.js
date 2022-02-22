module.exports = {
	execute: async function(bot, vars) {
		console.log(vars)
		bot.on("chat", (username, message) => {
			console.log(`**${username}:** ${message}`)
			try {
				vars.chatChannel.send(`**${username}:** ${message}`);
			} catch (err) {
				console.error(err)
			}
		});
	}, 
	cleanup: async function() {}
}