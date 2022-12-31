import { MatrixClient, Command } from '../src/command.js'
import { VERSION, COMMIT } from '../src/constants.js'

const version: Command = new Command(
    'version',
    async (client: MatrixClient, roomId: string, event: any, _: string[]) => {
        await client.replyHtmlNotice(
            roomId,
            event,
            `<strong>Version:</strong> ${VERSION} (<a href="https://github.com/teppyboy/ei-lover/commit/${COMMIT}">${COMMIT}</a>)`
        )
    },
    'Show the bot version and commit hash.',
)

const about: Command = new Command(
    'about',
    async (client: MatrixClient, roomId: string, event: any, _: string[]) => {
        await client.replyHtmlNotice(
            roomId,
            event,
            `<h1>ei-lover</h1>
            <p>ei-lover is a Matrix bot written in TypeScript.</p>
            <strong>Version:</strong> ${VERSION} (<a href="https://github.com/teppyboy/ei-lover/commit/${COMMIT}">${COMMIT}</a>)`
        )
    },
    'About this bot.',
)

export { version, about }
