const http = require('http');
const httpProxy = require('http-proxy');

const port = process.env.PORT || 10000;  // ← Исправлено: 10000 для Render

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
    // Эндпоинт для keep-alive (чтобы сервер не засыпал)
    if (req.url === '/ping') {
        res.writeHead(200);
        res.end('pong');
        return;
    }

    // Простая базовая аутентификация
    const auth = req.headers['proxy-authorization'];
    if (!auth || auth !== 'Basic ' + Buffer.from('mrq:123mrq123').toString('base64')) {
        res.writeHead(407, { 'Proxy-Authenticate': 'Basic realm="Proxy"' });
        res.end('Auth required');
        return;
    }

    // Проксируем запрос
    proxy.web(req, res, { target: req.url, secure: false }, (err) => {
        res.writeHead(500);
        res.end('Proxy Error');
    });
});

// Поддержка HTTPS CONNECT
server.on('connect', (req, clientSocket, head) => {
    const auth = req.headers['proxy-authorization'];
    if (!auth || auth !== 'Basic ' + Buffer.from('mrq:123mrq123').toString('base64')) {
        clientSocket.write('HTTP/1.1 407 Proxy Authentication Required\r\nProxy-Authenticate: Basic realm="Proxy"\r\n\r\n');
        clientSocket.end();
        return;
    }

    // Исправлено: правильно парсим hostname и port
    const urlParts = req.url.split(':');
    const hostname = urlParts[0];
    const targetPort = parseInt(urlParts[1]) || 443;

    const net = require('net');
    const serverSocket = net.connect(targetPort, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
    });

    serverSocket.on('error', () => clientSocket.end());
    clientSocket.on('error', () => serverSocket.end());
});

server.listen(port, () => {
    console.log(`Proxy server is running on port ${port}`);
});
