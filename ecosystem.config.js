module.exports = {
    apps: [
        {
            name: "quotation-server",
            cwd: "./server",
            script: "src/index.js",
            watch: true,
            env: {
                NODE_ENV: "development",
                PORT: 3000
            }
        },
        {
            name: "quotation-client",
            script: "C:\\Windows\\System32\\cmd.exe",
            args: "/c D:\\quotation-maker-main\\quotation-maker-main\\start_client.bat",
            interpreter: "none",
            watch: false,
            env: {
                PORT: 5173
            }
        }
    ]
};
