import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
const clients = {}
const rooms={
    "room001":{
        userList:[],
        name:"糞坑"
    },
    "room002":{
        userList:[],
        name:"多人群聊"}
}

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
            let allRooms = [];
            for(const [rid,obj] of Object.entries(rooms)){
                // console.log(rid,obj.name);
                allRooms.push({rid,name:obj.name})
            }



            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "registered",
                        otherClients,allRooms
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
        if(parseMsg.type === "creatRoom"){
            const {roomID,roomName,fromID} = parseMsg
            rooms[roomID]={
                userList:[fromID],
                name:roomName
            }

            let allRooms = [];
            for(const [rid,obj] of Object.entries(rooms)){
                allRooms.push({rid,name:obj.name})
            }
            console.log(allRooms);
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "newRoom",
                        allRooms
                    }));
                }
            })
        }
        if(parseMsg.type === "joinRoom"){
            const {roomID,fromID} = parseMsg
            rooms[roomID].userList.push(fromID)
            rooms[roomID].userList.forEach(uID => {
                let targetClient = clients[uID]
                if(targetClient && targetClient.readyState === WebSocket.OPEN){
                    targetClient.send(JSON.stringify({
                        type:"joinRoom",
                        fromID,roomID,
                        clientList:rooms[roomID].userList
                    }))
                }
            })
        }
        if(parseMsg.type === "leaveRoom"){
            
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