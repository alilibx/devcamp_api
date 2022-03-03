const NodeGeocoder = require('node-geocoder');

//Change to ENV Variables
const options = {
	provider: 'mapquest',
	httpAdapter: 'https',
	apiKey: '6VOdpZZAlLkwLR10TMJpGxTjoNpAtCdB',
	formatter: null
};

//console.log(options);
const geocoder = NodeGeocoder(options);

module.exports = geocoder;
