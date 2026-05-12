import Eris from 'eris';
import { Command } from '../types/command';

// const MUTE_DURATION = (14) * 24 * 60 * 60 * 1000; 

export default (bot: Eris.Client): Command => ({
    name: 'accountCreationCheck',
    description: 'Checks if the account is created less than 2 months ago',
    type: 'guildMemberAdd',
    async execute(guild: Eris.Guild, member: Eris.Member): Promise<void> {
        let created = new Date(member.createdAt);
        let now = new Date();
        let diff = now.getTime() - created.getTime();
        let diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        // if (diffDays < 60) {
        //     const muteUntil = new Date(Date.now() + MUTE_DURATION);
        // }
        if (diffDays < (30)) {
            await guild.banMember(member.id, 0, 'Account too new (<1 month.)');
            // await guild.banMember(member.id, 0, 'Account too new (<1 month, contact 1216795874877771806 in case this was a mistake.)');
            let dmChannel = await bot.getDMChannel('1216795874877771806'); // DM aris instead
            dmChannel.createMessage({
                embeds: [{
                    color: 0xffffff,
                    description: `<@${member.id}> (${member.username}) created their account <t:${Math.round(member.createdAt/1000)}:R> (<t:${Math.round(member.createdAt/1000)}:F>)`
                }],
                components: [{
                    type: Eris.Constants.ComponentTypes.ACTION_ROW,
                    components: [{
                        label: 'Visit Profile',
                        style: Eris.Constants.ButtonStyles.LINK,
                        type: Eris.Constants.ComponentTypes.BUTTON,
                        url: `https://discord.com/users/${member.id}`
                    }]
                }]
            });
        } 
    }
});
