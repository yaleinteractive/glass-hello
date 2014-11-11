// uses glass-prism Node.js library to interface with Glass
var prism = require("glass-prism");

// load configuration for this instance
var config = require("./config.json");
config.port = process.env.PORT;

prism.init(config, function(err) {
    console.log('Ready!', err);
    updateCard();
    // We could add setInterval(updateCard, 10 * 60 * 1000) to send updates automatically every 10 minutes
});

prism.on('newclient', onNewClient);
prism.on('subscription', onSubscription);

function onNewClient(tokens) {
    console.log('New client');
	updateCard();
};

function onSubscription(err, payload) {
    console.log("Subscription");
    // payload.item (e.g. payload.item.text) and payload.data.token are also available
	if (payload.data.userActions) {
	    for (var i = 0; i < payload.data.userActions.length; i++) {
	        var action = payload.data.userActions[i];
	        if (action.type == 'CUSTOM' && action.payload == 'update') { // Where 'update' is the id you gave to your custom button
	            console.log("User pressed Update");
	            // NOTE: This updates the cards for all clients; might want to update just this one.
	            updateCard();
	        }
	        // else if... for other buttons
	    }
	}
};

function updateCard() {
    console.log("Update card");
	for (var i = 0; i < prism.client_tokens().length; i++) {
	    var client_token = prism.client_tokens()[i];
        getLocation(client_token, function(err, location) {
            var lat, lon;
            if (location) {
                lat = location.latitude;
                lon = location.longitude;
            }
            var html = prism.cards.hello({
                latitude: lat,
                longitude: lon,
                timestamp: new Date()
            });
        	prism.updateCard({ 
        	    html: html,
        	    isPinned: true, 
        	    notification: { level: 'DEFAULT' }, 
        	    sourceItemId: "glass-hello",
        	    menuItems: [
        	        {
                        action: "CUSTOM",
                        id: "update", // This id for your button can be any string you want
                        values: [{
                            displayName: "Update"
                            // iconUrl: "http://example.com/icons/complete.png" to define a custom icon for your button
                            //   50x50 PNG Google recommends white with transparent background
                        }]
        	        },
        	       // {
        	       //    action: "PLAY_VIDEO",
        	       //    id: "play_video_1",
        	       //    payload: "http://dev.gormancommajon.com/screens/a_b_final.mp4",
        	       //    values: [{displayName: "Hyperspace"}]
        	       // },
        	        {
        	           action: "PLAY_VIDEO",
        	           id: "play_video_2",
        	           payload: "https://googleglass-c9-nejcprah.c9.io/balltest.mp4",
        	           values: [{displayName: "Ball video"}]
        	        },
        	        {
        	            action: "OPEN_URI",
        	            id: "open_website_1",
        	            payload: "https://googleglass-c9-nejcprah.c9.io/hello-world.html",
        	            values: [{displayName: "Ball webpage"}]
                    },
        	        {
        	            action: "OPEN_URI",
        	            id: "open_website_2",
        	            payload: "http://art.yale.edu/Art752a",
        	            values: [{displayName: "Art 752a"}]
                    } // , { ... }... for additional buttons
                ]
        	}, client_token);
        });
	}
}

function getLocation(client_token, callback) {
    console.log("Get location");
    prism.mirrorCall(prism.mirror().locations.get({ "id": "latest" }), client_token, function(err, data) {
        if (err) {
            console.log("Location error", err);
            callback(err);
        }
        else {
            if (data) console.log("Got location", data.latitude, data.longitude)
            callback(null, data);
        }
    });
}
