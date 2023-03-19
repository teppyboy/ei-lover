import * as globals from './globals.js'
import { Commands } from './commands.js'
import { Command } from './command.js'
import * as ts from 'ts-node'
import config from './config.js'
import { readdirSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import {
    MatrixClient,
    MatrixAuth,
    SimpleFsStorageProvider,
    RustSdkCryptoStorageProvider,
    AutojoinRoomsMixin,
    AutojoinUpgradedRoomsMixin,
    MessageEvent,
    MessageEventContent,
} from 'matrix-bot-sdk'
import dotenv from 'dotenv'

const logger = globals.defaultLogger

logger.level = config.logging.level || 'info'
logger.info(`ei-lover (${globals.commit}) starting up...`)
logger.info('Log level: ' + logger.level)
logger.trace(logger, 'Config loaded')
// Load environment variables from .env
dotenv.config()
logger.trace('Loaded env from dotenv')
// Configure the homeserver and storage provider
const homeserver: string = config.homeserver || globals.defaultHomeserver
logger.info(`Using homeserver ${homeserver}`)
if (!existsSync('./storage')) {
    mkdirSync('./storage')
}
const storage: SimpleFsStorageProvider = new SimpleFsStorageProvider(
    './storage/bot.json'
)
const crypto = new RustSdkCryptoStorageProvider('./storage/crypto')

let accessToken: string
// Create the client
if (process.env.ACCESS_TOKEN) {
    accessToken = process.env.ACCESS_TOKEN
} else {
    if (!process.env.USERNAME || !process.env.PASSWORD) {
        logger.fatal(
            'No Matrix access token or username & password specified.' +
                'Please set the ACCESS_TOKEN or the USERNAME and PASSWORD environment variables.'
        )
        process.exit(1)
    }
    logger.info('Logging in using credentials...')
    logger.warn(
        'It is recommended to use an access token instead of a username and password, ' +
            'which you can use by setting ACCESS_TOKEN environment variable.'
    )
    const auth: MatrixAuth = new MatrixAuth(homeserver)
    const simpleClient: MatrixClient = await auth.passwordLogin(
        process.env.USERNAME,
        process.env.PASSWORD
    )
    logger.info('Access token: ' + simpleClient.accessToken)
    accessToken = simpleClient.accessToken
    logger.warn('Please save this access token for future use.')
}
logger.info('Logging in using access token...')
var client: MatrixClient = new MatrixClient(
    homeserver,
    accessToken,
    storage,
    crypto
)
client.syncingPresence = 'online'

// Autojoin
logger.info('Enabling autojoin mixins...')
AutojoinRoomsMixin.setupOnClient(client)
AutojoinUpgradedRoomsMixin.setupOnClient(client)

// Commands
const prefixes: string[] = config.bot.prefixes || globals.prefixes
const commands: Commands = new Commands()
logger.info('Command prefixes: ' + prefixes)

logger.debug('Registering TS compiler instance...')
ts.register()
// Register internal commands
logger.info('Importing internal commands...')
const defaultFeatures = {
    core: 'core.js',
    ping: 'ping.js',
    vpn: 'vpn.js',
    shell: 'shell.js',
}
const features: string[] = config.bot.features || ['core']
const enabledFeatures: string[] = []
for (const [k, v] of Object.entries(defaultFeatures)) {
    if (features.includes('all') || features.includes(k)) {
        const command: Command = await import('./commands/' + v)
        commands.importCommand(command)
        logger.debug(`Commands '${v}' imported`)
        logger.trace(command)
        enabledFeatures.push(k)
    }
}
logger.info('Enabled features: ' + enabledFeatures.join(', '))

// Register external commands
logger.info('Importing external commands...')
if (!existsSync('./commands')) {
    mkdirSync('./commands')
}
readdirSync('./commands', { withFileTypes: true }).forEach(async (file) => {
    if (!file.isFile()) {
        return
    }
    if (
        path.extname(file.name) !== '.js' &&
        path.extname(file.name) !== '.js'
    ) {
        return
    }
    if (
        config.commands.compatibility.includes(path.extname(file.name).slice(1))
    ) {
        const command: Command = await import('../commands/' + file.name)
        // console.log(command)
        commands.importCommand(command)
        logger.debug('File imported: ' + file.name)
    }
})
logger.info(
    'Imported commands (internal & external): ' +
        commands.getCommandNames().join(', ')
)

// TODO: Add proper command handler
logger.info('Registering command handler...')
client.on(
    'room.message',
    async (roomId, event: MessageEvent<MessageEventContent>) => {
        if (!event.content?.msgtype) {
            return
        }
        if (event.sender === (await client.getUserId())) {
            return
        }
        const body: string = event.content.body
        for (const prefix of prefixes) {
            if (body.startsWith(prefix)) {
                const commandName: string = body
                    .split(' ')[0]
                    .slice(prefix.length)
                const command: Command | void = commands.getCommand(commandName)
                if (!command) {
                    await client.replyNotice(
                        roomId,
                        event,
                        `Unknown command: ${commandName}`
                    )
                    logger.debug(
                        'User executed unknown command: ' + commandName
                    )
                    return
                }
                const args: string[] = body.split(' ').slice(1)
                logger.debug(
                    `User executed '${command.name}' with args '${args}'`
                )
                try {
                    await command.invoke(client, roomId, event, args, commands)
                } catch (error) {
                    logger.warn(`Error while running ${command.name}: ${error}`)
                    await client.replyHtmlNotice(
                        roomId,
                        event,
                        `Error while running <code>${command.name}</code>: <pre><code>${error}</code></pre>`
                    )
                }
                break
            }
            return
        }
    }
)

try {
    client.start().then(async () => {
        logger.info('Bot started as ' + (await client.getUserId()))
    })
} catch (error) {
    logger.fatal('Closing bot due to error: ' + error)
}
