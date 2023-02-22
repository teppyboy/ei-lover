import { readFileSync } from 'node:fs'
import { defaultLogger } from './globals.js'

let config: any
const logger = defaultLogger.child({
    name: 'config',
})
try {
    config = JSON.parse(readFileSync('./config.json', 'utf8'))
} catch (error) {
    logger.error(`Error while reading config file: ${error}`)
    config = {}
}

if (process.env.HOMESERVER) {
    config.homeserver = process.env.HOMESERVER
}

if (process.env.BOT_OWNERS) {
    config.bot.owners = process.env.BOT_OWNERS.split(',')
}

if (process.env.BOT_PREFIX) {
    config.bot.prefix = process.env.BOT_PREFIX
}

if (process.env.BOT_FEATURES) {
    config.bot.features = process.env.BOT_FEATURES.split(',')
}

export default config
