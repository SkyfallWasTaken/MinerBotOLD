const { SlashCommandBuilder } = require("@discordjs/builders");
const Filter = require("bad-words"),
	filter = new Filter();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("chat")
		.setDescription("Chats on the server.")
		.addStringOption((option) =>
			option
				.setName("message")
				.setDescription("The message to send.")
				.setRequired(true)
		),
	async execute(interaction, bot) {
		bot.chat(
			filter.clean(
				`${interaction.user.tag} says: ${interaction.options.getString(
					"message"
				)}`
			)
		);
		return interaction.reply("Sent to server successfully!");
	},
};
