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
const vpnConfig = config.commands.config.vpn
let VPNProcess: ChildProcess | undefined
let checkInterval: NodeJS.Timeout | undefined
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
                'VPN server started.'
            )
            VPNProcess = sudo
            if (vpnConfig.check.enabled) {
                await client.sendNotice(
                    roomId,
                    `VPN server automatic check enabled (every ${vpnConfig.check.interval} ms).`
                )
                checkInterval = setInterval(async () => {
                    const result = await testVPN()
                    if (["SUCCESS", "SUCCESS_WITHOUT_ADDRESS"].includes(result.code)) {
                        return
                    }
                    if (result.code == "VPN_NOT_RUNNING") {
                        clearInterval(checkInterval)
                        checkInterval = undefined
                        return
                    }
                    await client.sendHtmlNotice(roomId, result.message)
                }, vpnConfig.check.interval)
            }
            // Do a check immediately after starting the server
            // Assuming sing-box runs fast on my machine, yours may vary
            await sleep(1000)
            // Hacky way
            // null as any to bypass ts(2345)
            await commands
                .getCommand('test')
                ?.invoke(client, roomId, null as any, args, commands)
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
            VPNProcess = undefined
            if (checkInterval) {
                clearInterval(checkInterval)
                checkInterval = undefined
            }
            await client.replyNotice(roomId, event, 'VPN server stopped.')
        },
        'Stops the VPN server'
    )
)

async function testVPN() {
    if (VPNProcess === undefined || VPNProcess.exitCode !== null) {
        return {
            code: "VPN_NOT_RUNNING",
            message: "VPN server is not running"
        }
    }
    const ipAddress = await getIpAddress()
    if (!ipAddress) {
        return {
            code: "GET_IPV4_FAILED",
            message: "Failed to get current IPv4 address"
        }
    }
    // Hardcode, will fix later...
    const result = await checkPort(80)
    if (!result) {
        return {
            code: "CHECK_PORT_FAILED",
            message: `Failed to check VPN server visible status for <code>${ipAddress}</code>`
        }
    }
    if (!result.isOpen) {
        return {
            code: "NOT_VISIBLE",
            message: `Failed: VPN server <code>${ipAddress}</code> is NOT visble to the internet: ` +
            result.reason
        }
    }
    const prettyAddr = vpnConfig.address
    if (!prettyAddr) {
        return {
            code: "SUCCESS_WITHOUT_ADDRESS",
            message: `Success: VPN server <code>${ipAddress}</code> is visble to the internet`
        }
    }
    try {
        const addrIps = await resolve4(prettyAddr)
        if (!addrIps.includes(ipAddress)) {
            return {
                code: "PARTIALLY_SUCCESS",
                message: `Partially success: VPN server <code>${ipAddress}</code> is visble but its address <code>${prettyAddr}</code> IPs (${addrIps}) doesn't match`
            }
        }
    } catch (error) {
        return {
            code: "PARTIALLY_SUCCESS",
            message: `Partially success: VPN server <code>${ipAddress}</code> is visble but its address <code>${prettyAddr}</code> cannot be resolved`
        }
    }
    return {
        code: "SUCCESS",
        message: `Success: VPN server <code>${prettyAddr}</code> (<code>${ipAddress}</code>) is visble to the internet`
    }
}

subcommands.addCommand(
    new Command(
        'test',
        async (client: MatrixClient, roomId: string, event: any) => {
            if (event == null) {
                await client.sendHtmlNotice(
                    roomId,
                    (await testVPN()).message
                )
                return
            }
            await client.replyHtmlNotice(
                roomId,
                event,
                (await testVPN()).message
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
