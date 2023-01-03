import { promisify } from 'util'
import { exec } from 'child_process'

const _exec = promisify(exec)

const COMMIT: string = (await _exec('git rev-parse --short HEAD')).stdout.trim() ?? 'unknown'
const VERSION: string = '0.0.1'
const HOMESERVER: string = 'https://matrix-client.matrix.org'
const PREFIX: string = '!'

export { COMMIT, VERSION, HOMESERVER, PREFIX }
