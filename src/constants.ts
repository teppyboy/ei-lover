import { promisify } from 'util'
import { exec } from 'child_process'

const _exec = promisify(exec)
const _commit = (await _exec('git rev-parse --short HEAD')).stdout.trim()

class Constants {
    static VERSION: string = '0.0.1'
    static VERSION_COMMIT: string = _commit
    static HOMESERVER: string = 'https://matrix-client.matrix.org'
    static PREFIX: string = '!'
}
export { Constants }
