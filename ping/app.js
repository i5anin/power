const ping = require('net-ping');

let session = ping.createSession();

const devices = [
    { name: "Умная розетка Tuya Smart Inc.", ip: "192.168.3.154" },
    { name: "TL-WR720N", ip: "192.168.3.46" },
    { name: "Робот-пылесос Dreame", ip: "192.168.3.163" },
    { name: "Камера GWIPC-6880065736", ip: "192.168.3.101" }
];

// Структура для хранения результатов
let pingResults = {};

function pingHost(device) {
    return new Promise((resolve, reject) => {
        session.pingHost(device.ip, (error, target, sent, received) => {
            const latency = error ? NaN : received - sent;
            resolve({ name: device.name, ip: device.ip, status: error ? 'Not reachable' : 'Alive', latency: latency });
        });
    });
}

async function pingDevices() {
    console.log("Starting ping test...");
    const results = await Promise.all(devices.map(device => pingHost(device)));

    // Обновление результатов
    results.forEach(result => {
        if (!pingResults[result.name]) {
            pingResults[result.name] = [];
        }
        pingResults[result.name].push({timestamp: new Date(), ...result});
    });

    console.log("Ping test completed");
    // Здесь можно добавить логику для отображения результатов в виде таблицы
    console.table(results);
}

// Планировщик запусков
setInterval(pingDevices, 600000);
pingDevices();
