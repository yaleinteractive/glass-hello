var prism = require("glass-prism");

prism.init({
    "client_id": "611399686787-pt8oftv6amo862rqoaqlc022aibb04hb.apps.googleusercontent.com",
    "client_secret": "wfIvsdAF-XtiA9ASU19Uz7Ge",
    "redirect_dir": "https://glass-hello-c9-danmichaelson.c9.io/oauth2callback",
    "port": process.env.PORT
}, function() {
    console.log('Ready');
    prism.all.insertCard({ text: "Hello, world!" });
});

prism.on('newclient', function(tokens) {
    prism.insertCard({ text: "Hi new client" }, tokens);
});
