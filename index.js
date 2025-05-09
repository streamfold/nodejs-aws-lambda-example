const https = require('https');

/**
 * AWS Lambda function that fetches latitude and longitude coordinates for a US zip code
 *
 * @param {Object} event - The Lambda event object
 * @param {string} event.zipCode - The US zip code to look up (can be provided in query parameters)
 * @returns {Object} Response containing location data or error message
 */
exports.handler = async (event) => {
    try {
        // Get zip code from event - supporting both direct property and query parameters
        let zipCode = event.zipCode;
        
        // Check if zipCode was provided in query parameters
        if (!zipCode && event.queryStringParameters) {
            zipCode = event.queryStringParameters.zipCode;
        }
        
        // Validate zip code
        if (!zipCode) {
            return formatResponse(400, { 
                error: "Missing zipCode parameter" 
            });
        }
        
        // Validate zip code format (5 digits)
        if (!/^\d{5}$/.test(zipCode)) {
            return formatResponse(400, { 
                error: "Invalid zip code format. Please provide a 5-digit US zip code." 
            });
        }
        
        // Fetch location data
        const locationData = await getLocationByZipCode(zipCode);
        
        return formatResponse(200, locationData);
    } catch (error) {
        console.error('Error:', error);
        
        return formatResponse(error.statusCode || 500, { 
            error: error.message || "An unexpected error occurred" 
        });
    }
};

/**
 * Fetches location data for a US zip code from Zippopotam.us API
 * 
 * @param {string} zipCode - 5-digit US zip code
 * @returns {Object} Location data including latitude and longitude
 */
async function getLocationByZipCode(zipCode) {
    return new Promise((resolve, reject) => {
        const url = `https://api.zippopotam.us/us/${zipCode}`;
        
        const request = https.get(url, (response) => {
            let data = '';
            
            // Handle HTTP error responses
            if (response.statusCode !== 200) {
                const error = new Error(`API request failed with status code: ${response.statusCode}`);
                error.statusCode = response.statusCode;
                response.resume(); // Consume response to free up memory
                reject(error);
                return;
            }
            
            // Accumulate data chunks
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            // Process complete response
            response.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    
                    // Format the response data
                    const formattedData = {
                        zipCode: parsedData['post code'],
                        country: parsedData.country,
                        countryAbbreviation: parsedData['country abbreviation'],
                        place: parsedData.places[0]['place name'],
                        state: parsedData.places[0].state,
                        stateAbbreviation: parsedData.places[0]['state abbreviation'],
                        latitude: parsedData.places[0].latitude,
                        longitude: parsedData.places[0].longitude
                    };
                    
                    resolve(formattedData);
                } catch (error) {
                    reject(new Error('Error parsing API response'));
                }
            });
        });
        
        // Handle connection errors
        request.on('error', (error) => {
            reject(new Error(`Error making API request: ${error.message}`));
        });
        
        // Set timeout
        request.setTimeout(5000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
        
        request.end();
    });
}

/**
 * Formats the Lambda response object
 * 
 * @param {number} statusCode - HTTP status code
 * @param {Object} body - Response body
 * @returns {Object} Formatted Lambda response
 */
function formatResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' // Enable CORS if needed
        },
        body: JSON.stringify(body)
    };
}