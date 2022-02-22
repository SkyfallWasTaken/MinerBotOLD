const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("eval")
		.setDescription("Evaluates a JavaScript expression.")
		.addStringOption((option) =>
			option
				.setName("expression")
				.setDescription("A Javascript expression.")
				.setRequired(true)
		),
	async execute(interaction, bot) {
		if (interaction.user.id !== "571393955367878656") {
			return interaction.reply({
				content: "Only the owner can use this command!",
				ephemeral: true,
			});
		}
        const expression = interaction.options.getString("expression")
		return interaction.reply({
			content:
				"```" + Function(expression)() + "```",
			ephemeral: true,
		});
	},
};
