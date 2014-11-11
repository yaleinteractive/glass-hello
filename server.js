// uses glass-prism Node.js library to interface with Glass
var prism = require("glass-prism");

// load configuration for this instance
var config = require("./config.json");
config.port = process.env.PORT;

prism.init(config, function(err) {
    console.log('Ready!', err);
    updateCard();
    setInterval(updateCard, 30000);
});

prism.on('newclient', onNewClient);
prism.on('subscription', onSubscription);

function onNewClient(tokens) {
    console.log('New client');
	updateCard();
};

function onSubscription(err, payload) {
    console.log('Subscription');
	if (payload.item) {
	    // Do something with payload.item (e.g. payload.item.text) and payload.data.token
	}
};

function updateCard() {
    console.log("Update card");
    prism.all.mirrorCall(prism.mirror().locations.get({ "id": "latest" }), function(err, data) {
        var lat, lon;
        if (err) {
            console.log('Location error', err);
        }
        else if (data) {
            lat = data.latitude;
            lon = data.longitude;
        }
    	prism.all.updateCard({ 
    	    text: lat + ', ' + lon + ', ' + String(new Date()), 
    	    isPinned: true, 
    	    notification: { level: 'DEFAULT' }, 
    	    sourceItemId: "glass-hello" 
    	});
    });
}
