import Eris from 'eris';
import { Command } from './types/command';
import * as fs from 'fs';
import * as path from 'path';
import config from './secret/config.json';

export class CommandHandler {
    private bot: Eris.Client;
    private prefix: string = config.prefix;
    private commands: Map<string, Map<string, Command>> = new Map();

    constructor(bot: Eris.Client) {
        this.bot = bot;
        this.loadCommands();
    }

    registerEvents(): void {
        console.log('Registering events for command handler');
        this.commands.forEach((commandMap, eventName) => {
            console.log(`Setting up event handler for: ${eventName}`);
            switch (eventName) {
                case 'onMessage':
                    this.bot.on('messageCreate', async (msg: Eris.Message) => {
                        if (msg.author.id === this.bot.user.id) return;
                        if (!msg.content.startsWith(this.prefix)) return;

                        const content = msg.content.slice(this.prefix.length).trim();
                        const words = content.split(/\s+/);
                        const commandName = words[0].toLowerCase();
                        const args = words.slice(1);

                        const command = commandMap.get(commandName);
                        if (command) {
                            try {
                                await command.execute(msg, args);
                            } catch (error) {
                                console.error(`Error executing onMessage command ${commandName}:`, error);
                            }
                        }
                    });
                    break;

                case 'interactionCreate':
                    this.bot.on('interactionCreate', async (interaction: Eris.Interaction) => {
                        console.log('Interaction event received:', {
                            type: interaction.type,
                            data: 'data' in interaction ? interaction.data : null
                        });

                        if (interaction.type !== Eris.Constants.InteractionTypes.MESSAGE_COMPONENT) {
                            console.log('Skipping non-component interaction');
                            return;
                        }

                        const componentInteraction = interaction as Eris.ComponentInteraction;
                        console.log('Processing component interaction:', componentInteraction.data.custom_id);

                        const command = commandMap.get(componentInteraction.data.custom_id);
                        if (command) {
                            try {
                                await command.execute(componentInteraction);
                                console.log(`Successfully executed command: ${command.name}`);
                            } catch (error) {
                                console.error(`Error executing interaction command ${command.name}:`, error);
                            }
                        }
                    });
                    break;

                case 'messageCreate':
                    this.bot.on('messageCreate', async (msg: Eris.Message) => {
                        commandMap.forEach(async (command) => {
                            try {
                                await command.execute(msg);
                            } catch (error) {
                                console.error(`Error executing messageCreate command ${command.name}:`, error);
                            }
                        });
                    });
                    break;

                default:
                    // Handle generic Eris events (e.g., 'guildJoin')
                    this.bot.on(eventName as any, async (...args: any[]) => {
                        console.log(`Event ${eventName} received:`, args);
                        commandMap.forEach(async (command) => {
                            try {
                                await command.execute(...args);
                            } catch (error) {
                                console.error(`Error executing ${eventName} command ${command.name}:`, error);
                            }
                        });
                    });
                    break;
            }
        });
    }

    async registerSlashCommands(): Promise<void> {
        const interactionCommands = this.commands.get('interactionCreate');
        if (!interactionCommands) {
            console.log('No interaction commands to register');
            return;
        }

        const commands: Eris.ApplicationCommandBulkEditOptions<false, Eris.ApplicationCommandTypes>[] = 
            Array.from(interactionCommands.values())
                .filter(cmd => cmd.interactionType !== undefined)
                .map(cmd => ({
                    name: cmd.name,
                    description: cmd.description,
                    options: cmd.options || [],
                    type: cmd.interactionType!
                }));

        if (commands.length === 0) {
            console.log('No slash commands to register');
            return;
        }

        try {
            await this.bot.bulkEditCommands(commands);
            console.log('Successfully registered slash commands:', commands.map(c => c.name));
        } catch (error) {
            console.error('Error registering slash commands:', error);
        }
    }

    private loadCommands(): void {
        const commandsPath = path.join(__dirname, 'commands');
        console.log(`Loading commands from: ${commandsPath}`);
        this.loadCommandsFromDir(commandsPath);
    }

    private loadCommandsFromDir(dir: string): void {
        const files = fs.readdirSync(dir, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dir, file.name);

            if (file.isDirectory()) {
                this.loadCommandsFromDir(fullPath);
            } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
                try {
                    const commandModule = require(fullPath);
                    let command: Command;

                    if (typeof commandModule === 'function') {
                        command = commandModule(this.bot);
                    } else if (commandModule.default) {
                        if (typeof commandModule.default === 'function') {
                            command = commandModule.default(this.bot);
                        } else {
                            command = commandModule.default;
                        }
                    } else {
                        command = commandModule;
                    }

                    if (!command.name || !command.type) {
                        console.warn(`Skipping invalid command in ${fullPath}: Missing name or type`, command);
                        continue;
                    }

                    if (!this.commands.has(command.type)) {
                        this.commands.set(command.type, new Map());
                    }
                    this.commands.get(command.type)!.set(command.name, command);
                    console.log(`Loaded command: ${command.name} for type: ${command.type} from ${fullPath}`);
                } catch (error) {
                    console.error(`Error loading command from ${fullPath}:`, error);
                }
            }
        }
    }
}