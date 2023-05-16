import { spawn } from 'child_process'
import { promisify } from 'util'
import { userInfo } from 'os'

const sleep = promisify(setTimeout)

function spawnSudoNT(command: string, args: string[], ...rest: any[]) {
    // You need "gsudo" for this to work.
    return spawn('sudo', [command, ...args], ...rest)
}

function spawnSudo(command: string, args: string[], ...rest: any[]) {
    if (process.platform == 'win32') {
        return spawnSudoNT(command, args, ...rest)
    }
    if (userInfo().uid == 0 && !process.env.SUDO_USER) {
        // Just spawn and return normally because we're already superuser
        return spawn((command = command), (args = args), ...rest)
    }
    // We only allow configuring through env because this is sensitive (RCE!)
    if (!process.env.SUDO_PASSWORD) {
        throw new Error('No sudo password was provided in env')
    }
    if (process.env.SUDO_USER) {
        const userArgs = args
        args = ['-u', process.env.SUDO_USER]
        args.push(...userArgs)
    }
    const sudoProc = spawn('sudo', ['-S', command, ...args], ...rest)
    const passwd = spawn('echo', [process.env.SUDO_PASSWORD])
    passwd.stdout.on('data', (data) => {
        sudoProc.stdin.write(data)
    })
    passwd.on('close', (_) => {
        sudoProc.stdin.end()
    })
    return sudoProc
}

export { spawnSudo, sleep }
