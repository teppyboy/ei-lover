import { spawnSync, ChildProcess } from 'child_process'
import { resolve4 } from 'dns/promises'
import { checkPort, getIpAddress } from '@teppyboy/portchecktool-api'
import { Commands } from '../commands.js'
import { paths } from '../globals.js'
import { MatrixClient, Command } from '../command.js'
import { mkdirSync, existsSync } from 'fs'
import config from '../config.js'
import { spawnSudo, sleep } from '../helpers.js'

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
let VPNProcess: ChildProcess | undefined
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
    'Personal VPN server management commands',
    []
)

subcommands.addCommand(
    new Command(
        'start',
        async (
            client: MatrixClient,
            roomId: string,
            event: any,
            args: any,
            commands: Commands
        ) => {
            if (VPNProcess !== undefined && VPNProcess.exitCode === null) {
                await client.replyNotice(
                    roomId,
                    event,
                    'VPN server is already running.'
                )
                return
            }
            const sudo = spawnSudo('sing-box', ['run'], {
                cwd: repoPath + '/sing-box/',
            })
            sudo.on('error', async (err) => {
                await client.replyNotice(
                    roomId,
                    event,
                    `Failed to start VPN server: ${err.message}`
                )
                VPNProcess = undefined
            })
            sudo.on('close', async (code) => {
                if (code !== 0) {
                    await client.replyNotice(
                        roomId,
                        event,
                        `The VPN server process exited with code ${code}: ${sudo.stderr.read()}`
                    )
                }
                VPNProcess = undefined
            })
            await client.replyNotice(
                roomId,
                event,
                'VPN server started, testing server...'
            )
            VPNProcess = sudo
            // Assuming sing-box runs fast on my machine, yours may vary
            await sleep(1000)
            // Hacky way
            await commands
                .getCommand('test')
                ?.invoke(client, roomId, event, args, commands)
        },
        'Starts VPN'
    )
)

subcommands.addCommand(
    new Command(
        'stop',
        async (client: MatrixClient, roomId: string, event: any) => {
            if (VPNProcess === undefined || VPNProcess.exitCode !== null) {
                await client.replyNotice(
                    roomId,
                    event,
                    'VPN server is not running.'
                )
                return
            }
            if (!VPNProcess.kill()) {
                await client.replyNotice(
                    roomId,
                    event,
                    'Failed to stop VPN server.'
                )
                return
            }
            await client.replyNotice(roomId, event, 'VPN server stopped.')
            VPNProcess = undefined
        },
        'Stops the VPN server'
    )
)

subcommands.addCommand(
    new Command(
        'test',
        async (client: MatrixClient, roomId: string, event: any) => {
            if (VPNProcess === undefined || VPNProcess.exitCode !== null) {
                await client.replyNotice(
                    roomId,
                    event,
                    'VPN server is not running.'
                )
                return
            }
            const ipAddress = await getIpAddress()
            if (!ipAddress) {
                await client.replyHtmlNotice(
                    roomId,
                    event,
                    `Failed to get current IPv4 address`
                )
                return
            }
            // Hardcode, will fix later...
            const result = await checkPort(80)
            if (!result) {
                await client.replyHtmlNotice(
                    roomId,
                    event,
                    `Failed to check VPN server visible status for <code>${ipAddress}</code>`
                )
                return
            }
            if (!result.isOpen) {
                await client.replyHtmlNotice(
                    roomId,
                    event,
                    `Failed: VPN server <code>${ipAddress}</code> is NOT visble to the internet: ` +
                        result.reason
                )
                return
            }
            const prettyAddr = config.commands.config.vpn.address
            if (!prettyAddr) {
                await client.replyHtmlNotice(
                    roomId,
                    event,
                    `Success: VPN server <code>${ipAddress}</code> is visble to the internet`
                )
                return
            }
            const addrIps = await resolve4(prettyAddr)
            if (!addrIps.includes(ipAddress)) {
                await client.replyHtmlNotice(
                    roomId,
                    event,
                    `Partially success: VPN server <code>${ipAddress}</code> is visble but its address <code>${prettyAddr}</code> IPs (${addrIps}) doesn't match`
                )
                return
            }
            await client.replyHtmlNotice(
                roomId,
                event,
                `Success: VPN server <code>${prettyAddr}</code> (<code>${ipAddress}</code>) is visble to the internet`
            )
        },
        'Tests the VPN server for open ports'
    )
)

if (process.env.SUDO_PASSWORD == null) {
    console.error('SUDO_PASSWORD is not set.')
    process.exit(1)
}
export { vpn }
