import { Command, MatrixClient } from '../command.js'
import config from '../config.js'
import { spawnSync } from 'child_process'
import { spawnSudo } from '../helpers.js'

const exec: Command = new Command(
    'exec',
    async (client: MatrixClient, roomId: string, event, args: string[]) => {
        if (!config.bot.owners.includes(event.sender)) {
            await client.replyNotice(
                roomId,
                event,
                'You do not have permission to run this command.'
            )
            return
        }
        const result = spawnSync(args[0], [...args.slice(1)], {
            timeout: 30000,
        })
        let replyTxt = `Result for <code>${args.join(' ')}</code><br>`
        if (result.stdout && result.stdout.toString().trim() !== '') {
            try {
                replyTxt += `stdout:<pre><code>${result.stdout.toString()}</code></pre>`
            } catch (e) {
                replyTxt += `stdout:<pre><code>Failed to get stdout with error: ${e}</code></pre>`
            }
        }
        if (result.stderr && result.stderr.toString().trim() !== '') {
            try {
                replyTxt += `stderr:<pre><code>${result.stderr.toString()}</code></pre>`
            } catch (e) {
                replyTxt += `stderr:<pre><code>Failed to get stderr with error: ${e}</code></pre>`
            }
        }
        await client.replyHtmlNotice(roomId, event, replyTxt)
    },
    'Execute commands',
    []
)

const shexec: Command = new Command(
    'shexec',
    async (client: MatrixClient, roomId: string, event, args: string[]) => {
        if (!config.bot.owners.includes(event.sender)) {
            await client.replyNotice(
                roomId,
                event,
                'You do not have permission to run this command.'
            )
            return
        }
        const result = spawnSync(args.join(' '), [], {
            timeout: 30000,
            shell: true,
        })
        let replyTxt = `Result for <code>${args.join(' ')}</code><br>`
        if (result.stdout && result.stdout.toString().trim() !== '') {
            try {
                replyTxt += `stdout:<pre><code>${result.stdout.toString()}</code></pre>`
            } catch (e) {
                replyTxt += `stdout:<pre><code>Failed to get stdout with error: ${e}</code></pre>`
            }
        }
        if (result.stderr && result.stderr.toString().trim() !== '') {
            try {
                replyTxt += `stderr:<pre><code>${result.stderr.toString()}</code></pre>`
            } catch (e) {
                replyTxt += `stderr:<pre><code>Failed to get stderr with error: ${e}</code></pre>`
            }
        }
        await client.replyHtmlNotice(roomId, event, replyTxt)
    },
    'Execute commands in a shell',
    []
)

const suexec: Command = new Command(
    'suexec',
    async (client: MatrixClient, roomId: string, event, args: string[]) => {
        if (!config.bot.owners.includes(event.sender)) {
            await client.replyNotice(
                roomId,
                event,
                'You do not have permission to run this command.'
            )
            return
        }
        const result = spawnSudo(args[0], [...args.slice(1)], {
            timeout: 30000,
            shell: true,
        })
        let replyTxt = `Result for <code>${args.join(' ')}</code><br>`
        if (result.stdout && result.stdout.toString().trim() !== '') {
            try {
                replyTxt += `stdout:<pre><code>${result.stdout.toString()}</code></pre>`
            } catch (e) {
                replyTxt += `stdout:<pre><code>Failed to get stdout with error: ${e}</code></pre>`
            }
        }
        if (result.stderr && result.stderr.toString().trim() !== '') {
            try {
                replyTxt += `stderr:<pre><code>${result.stderr.toString()}</code></pre>`
            } catch (e) {
                replyTxt += `stderr:<pre><code>Failed to get stderr with error: ${e}</code></pre>`
            }
        }
        await client.replyHtmlNotice(roomId, event, replyTxt)
    },
    'Execute commands using sudo (DANGEROUS!)',
    []
)

export { exec, shexec }
