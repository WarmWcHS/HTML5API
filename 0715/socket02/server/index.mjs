import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
const clients = {}

wss.on("connection", conn => {
    console.log("新使用者已連線");

    conn.on("message", msg => {
        console.log(`收到訊息：${msg}`);
        const parseMsg = JSON.parse(msg)
        if (parseMsg.type === "register") {
            const { userid } = parseMsg
            clients[userid] = conn
            conn.userID = userid

            const otherClients = Object.keys(clients)
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "registered",
                        otherClients
                    }));
                }
            })
        }
        if (parseMsg.type === "message") {
            const { targetID, fromID, message } = parseMsg
            if (!targetID) {
                // 世界頻
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "message",
                            message,
                            fromID
                        }));
                    }
                })
            } else {
                // 密頻
                const targetClient = clients[targetID]
                const fromClient = clients[fromID];
                [targetClient,fromClient].forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "message",
                            message,
                            fromID,
                            targetID
                        }));
                    }
                })
            }
        }
    })

    conn.on("close", () => {
        console.log("連接斷開");
        let dsID = conn.userID
        if (dsID) {
            delete clients[dsID]
        }
        const otherClients = Object.keys(clients)
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "registered",
                    otherClients,
                    dsID
                }));
            }
        })
    })
})