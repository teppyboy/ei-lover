import { spawnSync } from 'node:child_process'
import envPaths from 'env-paths'
import { Logger, pino } from 'pino'

const paths = envPaths('ei-lover')
const isGitDirty: boolean =
    spawnSync('git', ['status', '-s']).stdout.toString().trim() == ''
        ? true
        : false
const commit: string =
    spawnSync('git', ['rev-parse', '--short', 'HEAD'])
        .stdout.toString()
        .trim() ?? 'unknown' + (isGitDirty ? '-dirty' : '')
const botVersion: string = '1.0.0'
const defaultHomeserver: string = 'https://matrix-client.matrix.org'
const prefixes: string[] = ['!']
const defaultLogger: Logger = pino({
    name: 'ei-lover',
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    },
})

export {
    paths,
    commit,
    isGitDirty,
    botVersion,
    defaultHomeserver,
    prefixes,
    defaultLogger,
}
