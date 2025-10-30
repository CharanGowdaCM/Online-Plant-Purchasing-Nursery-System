const { EventEmitter } = require('events');

const activityEvents = new EventEmitter();
activityEvents.setMaxListeners(50);

module.exports = activityEvents;