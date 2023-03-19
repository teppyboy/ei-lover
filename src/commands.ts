import { Command } from './command.js'

class Commands {
    readonly _commands: Command[] = []
    getCommands(): Command[] {
        return this._commands
    }
    getCommandNames(): string[] {
        const names: string[] = []
        for (const command of this._commands) {
            names.push(command.name)
        }
        return names
    }
    getCommand(name: string): Command | undefined {
        for (const command of this._commands) {
            if (command.name === name) {
                return command
            }
            if (command.aliases) {
                for (const alias of command.aliases) {
                    if (alias === name) {
                        return command
                    }
                }
            }
        }
    }
    addCommand(command: Command): void {
        this._commands.push(command)
    }
    importCommand(module: any): void {
        Object.values(module).forEach((command: any) => {
            this.addCommand(command)
        })
    }
    removeCommand(name: string): void {
        this._commands.forEach((command, index) => {
            if (command.name === name) {
                return this._commands.splice(index, 1)
            }
            if (command.aliases) {
                command.aliases.forEach((alias) => {
                    if (alias === name) {
                        return this._commands.splice(index, 1)
                    }
                })
            }
        })
    }
}
export { Commands }
