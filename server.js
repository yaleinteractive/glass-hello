// uses glass-prism Node.js library to interface with Glass
var prism = require("glass-prism");
var geolib = require("geolib");

// load configuration for this instance
var config = require("./config.json");
config.port = process.env.PORT;
if (config.host) config.redirect_dir = config.redirect_dir || (config.host + "/oauth2callback");
if (config.host) config.subscription_callback = config.subscription_callback || (config.host + "/oauth2callback/subscription");
config.verifyHash = config.verify_hash || "art752a";
if (config.displayName) config.speakableName = config.speakableName || config.displayName;

prism.init(config, function(err) {
    console.log('Ready!', err);
	updateCardForAllGlasses();
    // We could add setInterval(updateCard, 10 * 60 * 1000) to send updates automatically every 10 minutes
    // TODO: Also subscribe to automatic location updates
});

prism.on('newclient', onNewClient);
prism.on('subscription', onSubscription);

function onNewClient(tokens) {
    console.log('New client');
	updateCard(tokens);
    // TODO: Also subscribe to automatic location updates
};

function onSubscription(err, payload) {
    console.log("Subscription");
    // payload.item (e.g. payload.item.text) and payload.data.token are also available
	if (payload.data.userActions) {
	    for (var i = 0; i < payload.data.userActions.length; i++) {
	        var action = payload.data.userActions[i];
	        if (action.type == 'CUSTOM' && action.payload == 'update') { // Where 'update' is the id you gave to your custom button
	            console.log("User pressed Update");
	            updateCard(payload.data.token);
	        }
	        else if (action.type == 'SHARE' && payload.data.collection == 'timeline') {
	            console.log("User shared a timeline item");
	            var itemId = payload.data.itemId;
	            getSharedImage(payload.data.itemId, payload.data.token);
	        }
	        // else if... for other buttons
	    }
	}
	
};

function updateCardForAllGlasses() {
    for (var i = 0; i < prism.client_tokens().length; i++) {
        updateCard(prism.client_tokens()[i]);
    }
}

// tokens represents an individual Glass
function updateCard(tokens) {
    console.log("Update card");
    getLocation(tokens, function(err, location) {
        var lat, lon, distance, html;
        var image = "http://art.yale.edu/image_columns/0003/4858/20070524_010537_486.jpg";
        if (location) {
            lat = location.latitude;
            lon = location.longitude;
            
            // Get the distance from Green Hall in meters
            distance = geolib.getDistance(location, {latitude: 41.308317, longitude: -72.932979});

        }
        if (distance != undefined && distance < 500) {
            html = prism.cards.grn({
                timestamp: new Date()
            })
        }
        else {
            html = prism.cards.hello({
                image: "http://art.yale.edu/image_columns/0003/4858/20070524_010537_486.jpg",
                latitude: lat,
                longitude: lon,
                timestamp: new Date()
            });
        }
    	prism.updateCard({ 
    	    html: html,
    	    isPinned: true, 
    	    notification: { level: 'DEFAULT' }, 
    	    sourceItemId: "glass-hello",
    	    menuItems: [
    	        {
    	            action: "TOGGLE_PINNED"
    	        },
    	        {
                    action: "CUSTOM",
                    id: "update", // This id for your button can be any string you want
                    values: [{
                        displayName: "Update"
                        // iconUrl: "http://example.com/icons/complete.png" to define a custom icon for your button
                        //   50x50 PNG Google recommends white with transparent background
                    }]
    	        },
    	        {
    	           action: "PLAY_VIDEO",
    	           payload: "http://dev.gormancommajon.com/screens/a_b_final.mp4",
    	           values: [{
    	               displayName: "Hyperspace"
    	           }]
    	        },
    	        {
    	            action: "OPEN_URI",
    	            payload: "http://art.yale.edu/Art752a",
    	            values: [{
    	                displayName: "Art 752a"
    	            }]
                } // , { ... }... for additional buttons
            ]
    	}, tokens);
    });
}

// tokens represents an individual Glass
// callback is a function to call once we receive the location
function getLocation(tokens, callback) {
    console.log("Get location");
    prism.mirrorCall(prism.mirror.locations.get({ "id": "latest" }), tokens, function(err, data) {
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

// itemId is a timeline item ID to get the first attachment from
// tokens represents the Glass that has the timeline item
function getSharedImage(itemId, tokens) {
    prism.mirrorCall(prism.mirror.timeline.get({ "id": itemId }), tokens, function(err, data) {
        if (err) {
            console.log("getSharedImage error", err);
        }
        else {
            var firstAttachment = data.attachments ? data.attachments[0] : undefined;
            if (firstAttachment) {
                console.log("getSharedImage", firstAttachment.contentType, firstAttachment.contentUrl);
                if (firstAttachment.contentType == 'image/jpeg') {
                    // TODO: But we don't know how to download it... Have to authenticate with OAuth I think.
                    //   Just using the URL in an <img> tag in card doesn't work (broken image), 
                    //   pasting into a browser doesn't work ("login required"), downloading using this server doesn't work (401)
                }
                else {
                    console.log("Attachment isn't a jpeg");
                }
            }
            else {
                console.log("No attachment");
            }
        }
    });
}
