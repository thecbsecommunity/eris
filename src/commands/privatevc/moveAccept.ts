import Eris from 'eris';
import { databaseManager } from '../../lib/database';
import { Command } from '../../types/command';

export default (bot: Eris.Client): Command => ({
    name: 'privatevc_move_accept',
    description: 'Accept being moved to a private voice channel',
    type: 'interactionCreate',
    bot,
    async execute(interaction: Eris.Interaction): Promise<void> {
        if (!(interaction instanceof Eris.ComponentInteraction) || interaction.data.component_type !== Eris.Constants.ComponentTypes.BUTTON) return;
        
        await interaction.deferUpdate();

        const ogMessage = await interaction.getOriginalMessage();
        const userID = ogMessage.content.match(/<@!?(\d+)>/)?.[1];
        const memberID = interaction.member?.id || interaction.user?.id!;
        if (memberID !== userID) {
            interaction.createMessage({
                content: "You are not authorized to accept this move.",
                embeds: [],
                components: [],
                flags: 64
            });
            return;
        }
        const privateVCOwnerId = ogMessage.interaction?.user.id!;
        const voiceID = await interaction.member?.voiceState?.channelID;
        if (!voiceID) {
            interaction.createMessage({
                content: "You must be in a voice channel to use this command.",
                embeds: [],
                components: [],
                flags: 64
            });
            return;
        }
        const privateVCId = await databaseManager.getPrivateVCByOwner(privateVCOwnerId);
        if (!privateVCId) {
            interaction.createMessage({
                content: "The private voice channel no longer exists.",
                embeds: [],
                components: [],
                flags: 64
            });
            return;
        }
        if (voiceID === privateVCId) {
            interaction.createMessage({
                content: "You are already in the private voice channel.",
                embeds: [],
                components: [],
                flags: 64
            });
            return;
        }
        try {
            await interaction.editOriginalMessage({
                        content: `<@${userID}> has been moved!`,
                        embeds: [{
                            description: `**~~Would you like to join <@${ogMessage.interaction?.user.id}>'s private voice channel?~~**`,
                            color: 0x57F287
                        }],
                        components: [{
                            type: Eris.Constants.ComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: Eris.Constants.ComponentTypes.BUTTON,
                                    style: Eris.Constants.ButtonStyles.SUCCESS,
                                    label: "Accept",
                                    custom_id: "privatevc_move_accept",
                                    disabled: true
                                },
                                {
                                    type: Eris.Constants.ComponentTypes.BUTTON,
                                    style: Eris.Constants.ButtonStyles.DANGER,
                                    label: "Decline",
                                    custom_id: "privatevc_move_decline",
                                    disabled: true
                                }
                            ]
                        }]
                    });

            await interaction.member?.edit({ channelID: privateVCId });

            try {
                const channel = bot.getChannel(privateVCId) as Eris.VoiceChannel;
                await channel?.editPermission(userID, Eris.Constants.Permissions.connect | Eris.Constants.Permissions.speak, 0, Eris.Constants.PermissionOverwriteTypes.USER, 'Granting access to moved member');
            } catch (error) {
                console.log("Error editing permissions for moved member:", error);
            }

        } catch (error) {
            console.log("Error moving member to private VC:", error);
            interaction.editOriginalMessage({
                content: "There was an error moving you to the private voice channel.",
                embeds: [],
                components: []
            });
        }
    }
});