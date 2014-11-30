// Uses glass-prism Node.js library to interface with Glass
var prism = require("glass-prism");
var geolib = require("geolib");
var MongoClient = require('mongodb').MongoClient;
var serveStatic = require('serve-static');
var finalhandler = require('finalhandler');

// Load configuration for this instance
var config = require("./config.json");

// The port must be set this way for Cloud9
config.port = process.env.PORT;

// Use various defaults if unspecified
if (config.host) config.redirect_dir = config.redirect_dir || (config.host + "/oauth2callback");
if (config.host) config.subscription_callback = config.subscription_callback || (config.host + "/oauth2callback/subscription");
config.verify_hash = config.verify_hash || "art752a";
if (config.displayName) config.speakableName = config.speakableName || config.displayName;

// Defaults for Mongodb
config.mongo_host = config.mongo_host || process.env.IP;
config.mongo_port = config.mongo_port || 27017;
config.mongo_db = config.mongo_db || 'glass';

// Route for static assets
var serve = serveStatic(__dirname);
config.routes = {
    'pages': function (req, res) {
        serve(req, res, finalhandler(req, res));
    }
};

// Connect to the database, and keep the connection as a global variable
var db;
var mongo_url = 'mongodb://' + config.mongo_host + ':' + config.mongo_port + '/' + config.mongo_db;
MongoClient.connect(mongo_url, function(err, connected_db) {
    if (err) console.log("Couldn't connect to mongo", err);
    
    db = connected_db;
    
    // Once connected to the database, initialize Prism
    prism.init(config, function(err) {
        console.log('Ready!', err);
        
        // Subscribe to automatic location updates for all existing clients
        subscribeToLocationForAllGlasses();
        
        // Update the card on all existing clients (Prism loads existing clients from .clienttokens.json)
    	updateCardForAllGlasses();
    	
        // We could add setInterval(updateCardForAllGlasses, 10 * 60 * 1000) to send updates automatically every 10 minutes

    });
    
});
    
// Listen for new clients and for subscription events
prism.on('newclient', onNewClient);
prism.on('subscription', onSubscription);

// This is called when a new client adds our app for the first time
function onNewClient(tokens) {
    console.log('New client');
    
    // Subscribe to automatic location updates
    subscribeToLocation(tokens);
    
    // Update the card for a new client
	updateCard(tokens);
	
    
}

// This is called when a user presses one of the custom menu items in our card; replies with a voice transcription;
// deletes or pins our card; shares something with our contact; launches our app with a voice command;
// and (if we've subscribed to location updates) every 10 minutes with latest location.
// See https://developers.google.com/glass/develop/mirror/static-cards#subscriptions for all the subscription types
// and corresponding payload formats.
function onSubscription(err, payload) {
    console.log("Subscription", payload);
    
    // payload.item (e.g. payload.item.text) is also available
    
    // See what the user did:
    
    // Automatic location update
    if (payload.data.collection == 'locations') {
        console.log("Automatic location update");
        // We still need to explicitly get the location. updateCard does that before updating the card.
        updateCard(payload.data.token);
    }
    
    // Something more explicit
	else if (payload.data.userActions) {
	    
	    for (var i = 0; i < payload.data.userActions.length; i++) {
	        var action = payload.data.userActions[i];
	        
	        // Pressed a custom menu item
	        if (action.type == 'CUSTOM' && action.payload == 'update') { // Where 'update' is the id you gave to your custom menu item
	            console.log("User pressed Update");
	            updateCard(payload.data.token);
	        }
	        
	        // Shared something with our contact
	        else if (action.type == 'SHARE' && payload.data.collection == 'timeline') {
	            console.log("User shared a timeline item");
	            getSharedImage(payload.data.itemId, payload.data.token);
	        }
	        
	        // else if... for other menu items
	        
	    }
	}

}

// Update or insert the card for all clients
function updateCardForAllGlasses() {
    for (var i = 0; i < prism.client_tokens().length; i++) {
        updateCard(prism.client_tokens()[i]);
    }
}

// Update or insert the card for one client
// tokens represents an individual Glass
function updateCard(tokens) {
    console.log("Update card");
    
    // First get the current location
    getLocation(tokens, function(err, location) {
        var lat, lon, distance, html;
        
        // Generate the HTML for the card
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
        
        // Update or insert the card, with some menu items
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
                    id: "update", // This id for your menu item can be any string you want
                    values: [{
                        displayName: "Update"
                        // iconUrl: "http://example.com/icons/complete.png" to define a custom icon for your menu item
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
                } // , { ... }... for additional menu items
            ]
    	}, tokens);
    });
}

function subscribeToLocationForAllGlasses() {
    for (var i = 0; i < prism.client_tokens().length; i++) {
        subscribeToLocation(prism.client_tokens()[i]);
    }
}

// Subscribe to location updates
// tokens represents an individual Glass
function subscribeToLocation(tokens) {
 	prism.mirrorCall(prism.mirror.subscriptions.insert({
		"callbackUrl": config.subscription_callback,
		"collection": "locations",
		"operation": [], // empty set = all
		"userToken": prism.client_tokens().indexOf(tokens),
		"verifyToken": config.verify_hash
	}), tokens, function(err) {
	    if (err) console.log("Error subscribing to location updates", err);
	});
}

// Get the location for one client
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
            if (data) {

                console.log("Got location", data.latitude, data.longitude);

                // Store the location in the database (this is non-blocking, callback below will happen simultaneously)
                if (db) {
                    // We use a special format for the location (GeoJSON) that allows geospatial querying in Mongo
                    db.collection('locations').insert({
                        loc: {type: "Point", coordinates: [data.longitude, data.latitude]},
                        timestamp: data.timestamp,
                        tokens: tokens
                    }, function(err, result) {
                        if (err) {
                            console.log("Error inserting location into database", err);
                        }
                        else {
                            // Make sure there is an index to support geospatial querying, also scoped to an individual Glass client for speed
                            db.collection('locations').ensureIndex({loc: '2dsphere', tokens: 1}, function() {
                                
                                // See how many past results are within 100 meters of this one
                                
                                db.collection('locations').find(
                                    {
                                        loc: {
                                            $nearSphere: {
                                                $geometry: {
                                                    type: 'Point',
                                                    coordinates: [data.longitude, data.latitude]
                                                }, 
                                                $maxDistance: 100
                                            }
                                        },
                                        tokens: tokens
                                    }, 
                                    {loc: true, timestamp: true}
                                ).count(function(err, result) {
                                    if (err) {
                                        console.log("Error getting previous locations");
                                    }
                                    else {
                                        console.log((result - 1) + " previous reports for this client within 100 meters of this location");
                                    }
                                });

                            });

                            
                        }
                    });
                }
                
                // Simple example to query the locations database:
                // db.locations.find({tokens: tokens}, {loc: true, timestamp: true})
                
            }
            callback(null, data);
        }
    });
}

// Get an image shared with our contact. This isn't yet complete.
// itemId is a timeline item ID to get the first attachment from
// tokens represents the Glass that has the timeline item
// TODO: Accept other shared content (spoken text...)
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
