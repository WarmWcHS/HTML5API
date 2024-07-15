import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({
    port: 8080
})

wss.on("connection", conn => {
    console.log("新的使用者連線");

    conn.on("message", msg => {
        console.log(`收到訊息:${msg}`);

        // WebSocket.OPEN
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg)
            }
        })
    })

    conn.on("close", e => {
        console.log("連接斷開");
    })
})