import Eris from 'eris';
import { databaseManager } from '../../lib/database';
import { Command } from '../../types/command';


export default (bot: Eris.Client): Command => ({
    name: 'removeUnusedVC',
    description: 'Removes VCs which were not deleted properly and are now empty',
    type: 'ready',
    async execute(): Promise<void> {

        const privateVCs = await databaseManager.getAllPrivateVCs();
        console.log(`Checking ${privateVCs.length} private VCs for removal...`);
        console.log(privateVCs);

        for (const channelID of privateVCs) {
            const channel = bot.getChannel(channelID) as Eris.VoiceChannel | undefined;
            if (channel && channel.voiceMembers.size === 0) {
                try {
                    await channel.delete();
                    await databaseManager.deletePrivateVC(channelID);
                    console.log(`Deleted unused private VC: ${channelID}`);
                } catch (error) {
                    console.log(`Error deleting unused private VC ${channelID}:`, error);
                }
            }
        }
        

    }
});