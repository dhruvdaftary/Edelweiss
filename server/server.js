// Load the required modules
const express = require('express');
const WebSocket = require('ws');
const net = require('net');
const app = express();
const server = app.listen(3000, () => {// Start the server
    console.log('Server started on port 3000');
});

// Serve the static HTML file
app.use(express.static('public'));

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

// Store the connected clients
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Add the client to the set
    clients.add(ws);

    // Listen for WebSocket close event
    ws.on('close', () => {
        console.log('Client disconnected');

        // Remove the client from the set
        clients.delete(ws);
    });
});

// Connect to the feed on port 9011 which is being run on cmd
const client = new net.Socket();
const port = 9011;
const host = '127.0.0.1';

client.connect(port, host, function () {
    console.log('Connected to feed');
    client.write("Hello From Client " + client.address().address);
});

let buffer = Buffer.alloc(0); // Initialized an empty buffer which can be appended with incoming data

client.on('data', function (data) {
    buffer = Buffer.concat([buffer, data]); // Append incoming data to the buffer

    console.log('Raw Data:', buffer); // Log the raw data for backend debugging

    while (buffer.length >= 130) { //since the byte size of each packet is 130, we will keep on decoding packets until the buffer is less than 130 bytes
        const packetLength = buffer.readUInt32LE(0); // Decode the Packet Length
        const tradingSymbol = buffer.toString('utf8', 4, 34); // Decode the Trading Symbol
        const sequenceNumber = buffer.readBigInt64LE(34); // Decode the Sequence Number
        const timestamp = buffer.readBigInt64LE(42); // Decode the Timestamp

        // Convert the timestamp to Unix Epoch timestamp (milliseconds)
        const unixTimestamp = Number(timestamp.toString()) / 1000;
        const unixEpochTimestamp = Math.floor(unixTimestamp);

        //General approach followed is to decode the data from the buffer and then log it to the console
        //first decode from Little Endian encoding and conver to string considering byte offset
        const ltp = buffer.readBigInt64LE(50).toString(); // Decode the Last Traded Price (LTP)
        const ltv = buffer.readBigInt64LE(58).toString(); // Decode the Last Traded Quantity
        const volume = buffer.readBigInt64LE(66).toString(); // Decode the Volume
        const bidPrice = buffer.readBigInt64LE(74).toString(); // Decode the Bid Price
        const bidQuantity = buffer.readBigInt64LE(82).toString(); // Decode the Bid Quantity
        const askPrice = buffer.readBigInt64LE(90).toString(); // Decode the Ask Price
        const askQuantity = buffer.readBigInt64LE(98).toString(); // Decode the Ask Quantity
        const openInterest = buffer.readBigInt64LE(106).toString(); // Decode the Open Interest (OI)
        const prevClosePrice = buffer.readBigInt64LE(114).toString(); // Decode the Previous Close Price
        const prevOpenInterest = buffer.readBigInt64LE(122).toString(); // Decode the Previous Open Interest

        // Log the decoded data to the console
        console.log('Packet Length:', packetLength);
        console.log('Raw Trading Symbol:', tradingSymbol);
        const parsedSymbol = parseTradingSymbol(tradingSymbol);// Parse the Trading Symbol using the parseTradingSymbol function
        console.log('Underlying:', parsedSymbol.underlying);
        console.log('Expiry Date:', parsedSymbol.expiryDate);
        console.log('Strike Price:', parsedSymbol.strikePrice);
        console.log('Option Type:', parsedSymbol.optionType);
        console.log('Sequence Number:', sequenceNumber.toString());
        console.log('Timestamp:', unixEpochTimestamp.toString());
        console.log('Last Traded Price (LTP):', ltp);
        console.log('Last Traded Quantity (LTV):', ltv);
        console.log('Volume:', volume);
        console.log('Bid Price:', bidPrice);
        console.log('Bid Quantity:', bidQuantity);
        console.log('Ask Price:', askPrice);
        console.log('Ask Quantity:', askQuantity);
        console.log('Open Interest (OI):', openInterest);
        console.log('Previous Close Price:', prevClosePrice);
        console.log('Previous Open Interest:', prevOpenInterest);

        //Calculate time difference (for time to maturity)
        let givenDate = parsedSymbol.expiryDate;
        let timeDifferenceInMinutes = calculateTimeDifferenceInMinutes(givenDate);
        function calculateTimeDifferenceInMinutes(givenDate) {
            var givenDateTime = new Date(givenDate + ' 15:30');
            var today = new Date();

            // Set the time for today's date to 15:30
            today.setHours(15);
            today.setMinutes(30);
            today.setSeconds(0);
            today.setMilliseconds(0);

            // Calculate the time difference in minutes
            var timeDiffInMinutes = Math.floor((givenDateTime - today) / (1000 * 60));

            // Return the time difference in minutes
            return timeDiffInMinutes;
        }

        console.log('Time difference:', timeDifferenceInMinutes, 'minutes');//for backend


        let timeToMaturity = timeDifferenceInMinutes / (365 * 24 * 60);//convert time difference to years


        if (timeToMaturity > 0) {//if time to maturity is greater than 0, calculate implied volatility
            // Calculate the implied volatility
            const optionPrice = parseFloat(ltp);
            const strikePrice = parseFloat(parsedSymbol.strikePrice);
            const riskFreeRate = 0.05; // 5% risk-free interest rate
            var impliedVolatility = calculateImpliedVolatility(optionPrice, strikePrice, riskFreeRate, timeToMaturity);
        }

        console.log('Implied Volatility:', impliedVolatility);

        // Create a message object with the data
        const message = {
            packetLength,
            tradingSymbol,
            underlying: parsedSymbol.underlying,
            expiryDate: parsedSymbol.expiryDate,
            strikePrice: parsedSymbol.strikePrice,
            optionType: parsedSymbol.optionType,
            sequenceNumber: sequenceNumber.toString(),
            timestamp: unixEpochTimestamp.toString(),
            ltp,
            ltv,
            volume,
            bidPrice,
            bidQuantity,
            askPrice,
            askQuantity,
            openInterest,
            prevClosePrice,
            prevOpenInterest,
            impliedVolatility,
        };


        // Convert the message object to JSON
        const jsonMessage = JSON.stringify(message);

        // Broadcast the message to all connected clients
        clients.forEach((client) => {
            client.send(jsonMessage);
        });

        // Remove the processed data from the buffer
        buffer = buffer.slice(130);
    }
});

// calculateImpliedVolatility function
function calculateImpliedVolatility(optionPrice, strikePrice, riskFreeRate, timeToMaturity) {
    // Define constants
    const d1MaxIterations = 100;
    const d1Precision = 0.0000001;

    // Initialize variables
    let volatility = 0.5; // Initial guess for volatility
    let d1;
    let price;
    let vega;

    // Define the Black-Scholes formula
    function blackScholes(d1, price, strikePrice, riskFreeRate, timeToMaturity) {
        const d2 = d1 - Math.sqrt(timeToMaturity);
        const callPrice = price * Math.exp(-riskFreeRate * timeToMaturity) * normCdf(d1) - strikePrice * Math.exp(-riskFreeRate * timeToMaturity) * normCdf(d2);
        return callPrice;
    }

    // Define the cumulative distribution function (CDF) of the standard normal distribution
    function normCdf(x) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        const t = 1.0 / (1.0 + p * Math.abs(x));
        const y = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
        const cdf = 1.0 - 0.5 * (1.0 + Math.sign(x) * y);
        return cdf;
    }

    // Iterate to find the implied volatility
    for (let i = 0; i < d1MaxIterations; i++) {
        d1 = (Math.log(optionPrice / strikePrice) + (riskFreeRate + (volatility * volatility) / 2) * timeToMaturity) / (volatility * Math.sqrt(timeToMaturity));
        price = blackScholes(d1, optionPrice, strikePrice, riskFreeRate, timeToMaturity);
        vega = strikePrice * Math.sqrt(timeToMaturity) * normCdf(d1);
        const diff = price - optionPrice;
        if (Math.abs(diff) < d1Precision) {
            break; }
        volatility -= diff / vega;
    }

    // Return the calculated implied volatility
    return volatility;
}

// parseTradingSymbol() function
function parseTradingSymbol(tradingSymbol) {
    let underlying = '';
    let expiryDate = '';
    let strikePrice = '';
    let optionType = '';
  
    // Extract the underlying symbol (first part)
    const underlyingRegex = /^[A-Za-z]+/;
    const underlyingMatch = tradingSymbol.match(underlyingRegex);
    if (underlyingMatch) {
      underlying = underlyingMatch[0].trim();
    }
  
    // Extract the expiry date (second part)
    const expiryRegex = /(\d{2}[A-Z]{3}\d{2})/;
    const expiryMatch = tradingSymbol.match(expiryRegex);
    if (expiryMatch) {
      expiryDate = expiryMatch[0];
    }
  
    // Extract the strike price and option type (third and fourth part, applicable for options and futures symbols)
    const optionPart = tradingSymbol.substring(underlying.length + expiryDate.length).trim();
    const optionParts = optionPart.split(' ');
  
    if (optionParts.length >= 2) {
      const digitsRegex = /\d+/;
      const alphabetsRegex = /[A-Za-z]+/;
  
      const strikePriceMatch = optionParts[0].match(digitsRegex);
      const optionTypeMatch = optionParts[optionParts.length - 1].match(alphabetsRegex);
  
      if (strikePriceMatch) {
        strikePrice = strikePriceMatch[0].trim();
      }
  
      if (optionTypeMatch) {
        const optionTypeValue = optionTypeMatch[0].trim();
  
        if (optionTypeValue === 'XX') {
          optionType = 'Future Option';
          strikePrice = '0';
        } else if (optionTypeValue === 'PE') {
          optionType = 'Put Option';
        } else if (optionTypeValue === 'CE') {
          optionType = 'Call Option';
        }
      }
    } else if (optionParts.length === 1) {
      const digitsRegex = /\d+/;
      const alphabetsRegex = /[A-Za-z]+/;
  
      const strikePriceMatch = optionParts[0].match(digitsRegex);
      const optionTypeMatch = optionParts[0].match(alphabetsRegex);
  
      if (strikePriceMatch) {
        strikePrice = strikePriceMatch[0].trim();
      }
  
      if (optionTypeMatch) {
        const optionTypeValue = optionTypeMatch[0].trim();
  
        if (optionTypeValue === 'XX') {
          optionType = 'Future Option';
          strikePrice = '0';
        } else if (optionTypeValue === 'PE') {
          optionType = 'Put Option';
        } else if (optionTypeValue === 'CE') {
          optionType = 'Call Option';
        }
      }
    }
  
    return {
      underlying,
      expiryDate,
      strikePrice,
      optionType
    };
  }
  
