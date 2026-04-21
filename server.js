const ProxyChain = require('proxy-chain');

const server = new ProxyChain.Server({
    port: 10000,
    verbose: true,
    prepareRequestFunction: () => {
        return {
            requestAuthentication: async (username, password) => {
                return username === 'mrq' && password === '123mrq123';
            }
        };
    }
});

server.listen(() => {
    console.log(`Proxy with HTTPS support running on port ${server.port}`);
});
