import { Constants } from "./constants.js";
import { Commands } from "./commands.js";
import { Command } from "./command.js";
import { readdirSync } from "fs";
import path from "path";
import { MatrixClient, MatrixAuth, SimpleFsStorageProvider, RustSdkCryptoStorageProvider, AutojoinRoomsMixin } from "matrix-bot-sdk";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

// Configure the homeserver and storage provider
const homeserver: string = process.env.HOMESERVER || Constants.HOMESERVER;
console.log(`Using homeserver ${homeserver}`);
const storage: SimpleFsStorageProvider = new SimpleFsStorageProvider("./storage/bot.json");
const crypto = new RustSdkCryptoStorageProvider("./storage/crypto");

// Create the client
if (!process.env.ACCESS_TOKEN) {
    if (!process.env.USERNAME || !process.env.PASSWORD) {
        console.error("No Matrix access token or username & password specified. Please set the ACCESS_TOKEN or the USERNAME and PASSWORD environment variables.");
        process.exit(1);
    }
    console.log("Logging in using credentials...");
    console.warn("It is recommended to use an access token instead of a username and password, which you can use by setting ACCESS_TOKEN environment variable.")
    const auth: MatrixAuth = new MatrixAuth(homeserver);
    const simpleClient: MatrixClient = await auth.passwordLogin(process.env.USERNAME, process.env.PASSWORD);
    console.log("Access token: " + simpleClient.accessToken);
    var client: MatrixClient = new MatrixClient(homeserver, simpleClient.accessToken, storage, crypto);
} else {
    console.log("Logging in using access token...");
    var client: MatrixClient = new MatrixClient(homeserver, process.env.ACCESS_TOKEN, storage, crypto);
}

// Autojoin
console.log("Enabling autojoin...");
AutojoinRoomsMixin.setupOnClient(client);

// Register commands
const prefix = process.env.PREFIX || Constants.PREFIX;
const commands = new Commands();
console.log("Command prefix: " + prefix);
console.log("Registering commands from ./commands ...");
readdirSync("./commands", { withFileTypes: true }).forEach(async file => {
    if (!file.isFile()) {
        return;
    }
    if (path.extname(file.name) !== ".js") {
        return;
    }
    console.log("Registering command " + file.name);
    const command: Command = await import("./commands/" + file.name);
    console.log(command);
    commands.importCommand(command);
})
console.log("Registered all commands.");
// TODO: Add proper command handler
client.on("room.message", async (roomId, event) => {
    if (!event.content?.msgtype) {
        return;
    }
    if (event.sender === await client.getUserId()) {
        return;
    }
    const body: string = event.content.body;
    if (!body.startsWith(prefix)) {
        return;
    }
    const commandName: string = body.split(" ")[0].slice(prefix.length);
    const command = commands.getCommand(commandName);
    if (!command) {
        return;
    }
    const args: string[] = body.split(" ").slice(1);
    await command.invoke(client, roomId, event, args);
});

client.start().then(async () => {
    console.log("Bot started as " + await client.getUserId());
});
