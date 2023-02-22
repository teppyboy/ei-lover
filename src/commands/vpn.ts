import { spawn, spawnSync, ChildProcess } from 'child_process'
import { Commands } from '../commands.js'
import { paths } from '../globals.js'
import { MatrixClient, Command } from '../command.js'
import { mkdirSync, existsSync } from 'fs'
import config from '../config.js'

const dataPath = paths.data + '/commands/vpn/'
const repoPath: string = dataPath + '/everything-v2ray/'

if (!existsSync(dataPath)) {
    mkdirSync(dataPath, { recursive: true })
}
if (existsSync(repoPath)) {
    spawnSync('git', ['pull'], { cwd: repoPath })
} else {
    spawnSync('git', [
        'clone',
        'https://github.com/teppyboy/everything-v2ray',
        repoPath,
    ])
}
let VPNProcess: ChildProcess | null = null
const subcommands: Commands = new Commands()
const vpn: Command = new Command(
    'vpn',
    async (
        client: MatrixClient,
        roomId: string,
        event,
        args: string[],
        commands: Commands
    ) => {
        if (!config.bot.owners.includes(event.sender)) {
            await client.replyNotice(
                roomId,
                event,
                'You do not have permission to run this command.'
            )
            return
        }
        const subcommand = subcommands.getCommand(args[0])
        if (!subcommand) {
            await client.replyNotice(
                roomId,
                event,
                `Unknown subcommand: ${args[0]}`
            )
            return
        }
        try {
            await subcommand.invoke(
                client,
                roomId,
                event,
                args.slice(1),
                subcommands,
                commands
            )
        } catch (error) {
            console.error(`Error while running ${subcommand.name}: ${error}`)
            await client.replyNotice(
                roomId,
                event,
                `Error while running <code>${subcommand.name}</code>: ${error}`
            )
        }
    },
    'VPN-related commands',
    []
)

subcommands.addCommand(
    new Command(
        'start',
        async (client: MatrixClient, roomId: string, event: any) => {
            if (VPNProcess != null && VPNProcess.exitCode === null) {
                await client.replyNotice(
                    roomId,
                    event,
                    'VPN is already running.'
                )
                return
            }
            const echo = spawn('echo', [process.env.SUDO_PASSWORD || ''])
            const sudo = spawn('sudo', ['-S', 'sing-box', 'run'], {
                cwd: repoPath + "/sing-box/",
            })
            echo.stdout.on('data', (data) => {
                sudo.stdin.write(data)
            })
            echo.on('close', (_) => {
                sudo.stdin.end()
            })
            sudo.on('error', async (err) => {
                await client.replyNotice(
                    roomId,
                    event,
                    'Failed to start VPN: ' + err
                )
                VPNProcess = null
            })
            sudo.on('close', async (code) => {
                if (code !== 0) {
                    await client.replyNotice(
                        roomId,
                        event,
                        `VPN process exited with code ${code}`
                    )
                }
                VPNProcess = null
            })
            await client.replyNotice(roomId, event, 'VPN started.')
            VPNProcess = sudo
        },
        'Starts VPN'
    )
)

subcommands.addCommand(
    new Command(
        'stop',
        async (client: MatrixClient, roomId: string, event: any) => {
            if (VPNProcess == null || VPNProcess.exitCode !== null) {
                await client.replyNotice(
                    roomId,
                    event,
                    'VPN is already stopped.'
                )
                return
            }
            if (!VPNProcess.kill()) {
                await client.replyNotice(roomId, event, 'Failed to stop VPN.')
                return
            }
            await client.replyNotice(roomId, event, 'VPN stopped.')
            VPNProcess = null
        },
        'Stops VPN'
    )
)

if (process.env.SUDO_PASSWORD == null) {
    console.error('SUDO_PASSWORD is not set.')
    process.exit(1)
}
export { vpn }
