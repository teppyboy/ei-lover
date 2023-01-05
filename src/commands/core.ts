import { MatrixClient, Command } from '../command.js'
import { Commands } from '../commands.js'
import { VERSION, COMMIT, GIT_DIRTY } from '../constants.js'

const version: Command = new Command(
    'version',
    async (client: MatrixClient, roomId: string, event: any) => {
        const dirtyStr = GIT_DIRTY ? ' (dirty)' : ''
        const commitStr =
            COMMIT === 'unknown'
                ? 'unknown'
                : `(<a href="https://github.com/teppyboy/ei-lover/commit/${COMMIT}">${COMMIT}</a>${dirtyStr})`
        await client.replyHtmlNotice(
            roomId,
            event,
            `<strong>Version:</strong> ${VERSION} ${commitStr}`
        )
    },
    'Show the bot version and commit hash.'
)

const about: Command = new Command(
    'about',
    async (client: MatrixClient, roomId: string, event: any) => {
        const dirtyStr = GIT_DIRTY ? ' (dirty)' : ''
        const commitStr =
            COMMIT === 'unknown'
                ? 'unknown'
                : `(<a href="https://github.com/teppyboy/ei-lover/commit/${COMMIT}">${COMMIT}</a>${dirtyStr})`
        await client.replyHtmlNotice(
            roomId,
            event,
            `<h1>ei-lover</h1>
            <p>ei-lover is a Matrix bot written in TypeScript.</p>
            <strong>Version:</strong> ${VERSION} ${commitStr}`
        )
    },
    'About this bot.',
    ['info']
)

async function replyHelp(
    client: MatrixClient,
    roomId: string,
    event: any,
    _: string[],
    commands: Commands,
    ...rest: any[]
) {
    const parentCommands: Commands = rest[0] ?? commands
    const commandList = parentCommands.getCommands()
    let helpMessage = `<h1>Help</h1>
    All available commands:
    <ul>\n`
    for (const command of commandList) {
        if (command.aliases.length > 0) {
            helpMessage += `<li><strong>${
                command.name
            }</strong> (${command.aliases.join(', ')}) - ${
                command.description
            }</li>\n`
            continue
        }
        helpMessage += `<li><strong>${command.name}</strong> - ${command.description}</li>\n`
    }
    helpMessage += '</ul>'
    await client.replyHtmlNotice(roomId, event, helpMessage)
}

const help: Command = new Command('help', replyHelp, 'Show this help message.')

// Subcommands for "commands" command
const _subcommands: Commands = new Commands()
_subcommands.addCommand(
    new Command('list', replyHelp, 'List all commands.', ['ls'])
)

const _commands: Command = new Command(
    'commands',
    async (
        client: MatrixClient,
        roomId: string,
        event: any,
        args: string[],
        commands: Commands
    ) => {
        if (args.length === 0) {
            await replyHelp(client, roomId, event, args, commands)
            return
        }
        const subcommand = _subcommands.getCommand(args[0])
        if (!subcommand) {
            await client.replyNotice(
                roomId,
                event,
                `Unknown subcommand: ${args[0]}`
            )
            return
        }
        try {
            await subcommand.invoke(
                client,
                roomId,
                event,
                args.slice(1),
                _subcommands,
                commands
            )
        } catch (error) {
            console.error(`Error while running ${subcommand.name}: ${error}`)
            await client.replyNotice(
                roomId,
                event,
                `Error while running <code>${subcommand.name}</code>: ${error}`
            )
        }
    },
    'Command manager.',
    ['cmds']
)

export { version, about, help, _commands }
