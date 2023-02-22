import { MatrixClient, MessageEvent, MessageEventContent } from 'matrix-bot-sdk'
import { Commands } from './commands.js'

class Command {
    name: string
    description: string
    aliases: string[]
    callback: (
        client: MatrixClient,
        roomId: string,
        event: MessageEvent<MessageEventContent>,
        args: string[],
        commands: Commands,
        ...rest: any[]
    ) => Promise<void>
    constructor(
        name: string,
        callback: (
            client: MatrixClient,
            roomId: string,
            event: MessageEvent<MessageEventContent>,
            args: string[],
            commands: Commands,
            ...rest: any[]
        ) => Promise<void>,
        description: string = 'A command',
        aliases: string[] = []
    ) {
        this.name = name
        this.description = description
        this.aliases = aliases
        this.callback = callback
    }
    // TODO: Proper event type
    async invoke(
        client: MatrixClient,
        roomId: string,
        event: MessageEvent<MessageEventContent>,
        args: string[],
        commands: Commands,
        ...rest: any[]
    ) {
        await this.callback(client, roomId, event, args, commands, ...rest)
    }
}
export { MatrixClient, Command }
