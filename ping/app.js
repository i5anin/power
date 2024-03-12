const ping = require('net-ping');

// Создаем сессию с опциями по умолчанию
let session = ping.createSession();

// Функция для пинга одного IP-адреса
function pingHost(host) {
    return new Promise((resolve, reject) => {
        session.pingHost(host, function (error, target, sent, rcvd) {
            let ms = rcvd - sent;
            if (error) {
                if (error instanceof ping.RequestTimedOutError) {
                    resolve({ host: target, status: 'Not reachable' });
                } else {
                    resolve({ host: target, status: 'Error', error: error.toString() });
                }
            } else {
                resolve({ host: target, status: 'Alive', time: ms });
            }
        });
    });
}

// Функция для пинга диапазона IP-адресов
async function pingRange(startIp, endIp) {
    let results = [];

    // Преобразуем IP-адреса в числа для удобства итерации
    let start = ipToInt(startIp);
    let end = ipToInt(endIp);

    for (let i = start; i <= end; i++) {
        let ip = intToIp(i);
        let result = await pingHost(ip);
        results.push(result);
        console.log(result);
    }

    return results;
}

// Вспомогательная функция для преобразования IP в число
function ipToInt(ip) {
    return ip.split('.').reduce(function(ipInt, octet) {
        return (ipInt << 8) + parseInt(octet, 10);
    }, 0) >>> 0;
}

// Вспомогательная функция для преобразования числа обратно в IP
function intToIp(int) {
    return [int >>> 24, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');
}

// Пример использования
pingRange('192.168.1.1', '192.168.1.10').then(results => {
    console.log('Ping test completed:', results);
}).catch(err => {
    console.error(err);
});
