// sse.js - Shared Server-Sent Events logic
let clients = [];

function addClient(res, gameCode = null) {
    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res,
        gameCode
    };
    clients.push(newClient);

    // Remove client on close
    res.on('close', () => {
        removeClient(clientId);
    });

    return clientId;
}

function removeClient(clientId) {
    const index = clients.findIndex(c => c.id === clientId);
    if (index !== -1) {
        clients.splice(index, 1);
    }
}

function broadcast(event, data, targetGameCode = null) {
    console.log(`SSE Broadcast: Event=${event}, Target=${targetGameCode}, TotalClients=${clients.length}`);
    clients.forEach(client => {
        // If targetGameCode is specified, only send to clients with that code
        if (targetGameCode && client.gameCode !== targetGameCode) {
            return;
        }
        console.log(`SSE Sending to client ${client.id} (GameCode: ${client.gameCode})`);
        client.res.write(`event: ${event}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
}

module.exports = {
    addClient,
    removeClient,
    broadcast,
    clients // Export for monitoring
};
