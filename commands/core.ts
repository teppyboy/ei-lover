import { MatrixClient, Command } from '../src/command.js'
import { Commands } from '../src/commands.js'
import { VERSION, COMMIT } from '../src/constants.js'

const version: Command = new Command(
    'version',
    async (client: MatrixClient, roomId: string, event: any) => {
        const commitStr = ((COMMIT === "unknown") ? "unknown": `(<a href="https://github.com/teppyboy/ei-lover/commit/${COMMIT}">${COMMIT}</a>)`)
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
        const commitStr = ((COMMIT === "unknown") ? "unknown": `(<a href="https://github.com/teppyboy/ei-lover/commit/${COMMIT}">${COMMIT}</a>)`)
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

const help: Command = new Command(
    'help',
    async (client: MatrixClient, roomId: string, event: any, _: string[], commands: Commands) => {
        const commandList = commands.getCommands()
        let helpMessage = `<h1>Help</h1>
        All available commands:
        <ul>\n`
        for (const command of commandList) {
            if (command.aliases.length > 0) {
                helpMessage += `<li><strong>${command.name}</strong> (${command.aliases.join(', ')}) - ${command.description}</li>\n`
                continue
            }
            helpMessage += `<li><strong>${command.name}</strong> - ${command.description}</li>\n`
        }
        helpMessage += "</ul>"
        await client.replyHtmlNotice(
            roomId,
            event,
            helpMessage
        )
    },
    'Show this help message.'
)

export { version, about, help }
