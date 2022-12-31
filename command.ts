import { MatrixClient } from 'matrix-bot-sdk'

class Command {
    name: string
    description: string
    aliases: string[]
    callback: (
        client: MatrixClient,
        roomId: string,
        event: any,
        args: string[]
    ) => Promise<void>
    constructor(
        name: string,
        callback: any,
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
        event: any,
        args: string[]
    ) {
        await this.callback(client, roomId, event, args)
    }
}
export { MatrixClient, Command }
