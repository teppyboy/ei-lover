import { MatrixClient, Command } from '../src/command.js'

const ping: Command = new Command(
    'ping',
    async (
        client: MatrixClient,
        roomId: string,
        event: any,
        args: string[]
    ) => {
        console.log('Args:', args)
        await client.replyNotice(roomId, event, 'Pong!')
    },
    'Ping the bot!',
    ['pong']
)

export { ping }
