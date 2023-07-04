//Necessary imports
import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {//Main component
  const [messages, setMessages] = useState([]);

  useEffect(() => {//Websocket connection
    const socket = new WebSocket('ws://localhost:3000');

    socket.onopen = () => {//On connection
      console.log('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {//On message
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    socket.onclose = () => {//On disconnection
      console.log('Disconnected from WebSocket server');
    };

    return () => {
      socket.close();
    };
  }, []);


  const currentYear = new Date().getFullYear();//Current year

  return (//Main return
    <div className="App">
      <header className="header">
        <h1 className="header__title">Edelweiss</h1>
        <nav className="navbar">
          <ul className="navbar__list">
            <li className="navbar__item">Home</li>
            <li className="navbar__item">About</li>
            <li className="navbar__item">Contact</li>
          </ul>
        </nav>
      </header>
      <main>
        <div className="main-containe">
          <table>
            <thead className="table__head">
              <tr>
                <th>Name</th>
                <th>Expiry Date</th>
                <th>Strike Price</th>
                <th>Option Type</th>
                <th>Last Traded Price (LTP)</th>
                <th>Last Traded Quantity</th>
                <th>Volume</th>
                <th>Bid Price</th>
                <th>Bid Quantity</th>
                <th>Ask Price</th>
                <th>Ask Quantity</th>
                <th>Open Interest (OI)</th>
                <th>Previous Close Price</th>
                <th>Previous Open Interest</th>
                <th>Implied Volatility</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message, index) => {//Mapping through the messages
              //Checking if the option is ITM or OTM
              //ITM is red and OTM is blue
                const isITM = message.optionType === 'Call Option' && message.ltp > message.strikePrice;
                const isOTM = message.optionType === 'Call Option' && message.ltp < message.strikePrice;
                return (
                  <tr key={index}>
                    <td>{message.underlying}</td>
                    <td>{message.expiryDate}</td>
                    <td className={isITM ? 'itm' : isOTM ? 'otm' : ''}>{message.strikePrice}</td>
                    <td>{message.optionType}</td>
                    {/* <td>{message.timestamp}</td> */}
                    <td>{message.ltp}</td>
                    <td>{message.ltv}</td>
                    <td>{message.volume}</td>
                    <td>{message.bidPrice}</td>
                    <td>{message.bidQuantity}</td>
                    <td>{message.askPrice}</td>
                    <td>{message.askQuantity}</td>
                    <td>{message.openInterest}</td>
                    <td>{message.prevClosePrice}</td>
                    <td>{message.prevOpenInterest}</td>
                    <td>{message.impliedVolatility}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
      <footer className="footer">
        <p className="footer__text">&copy; {currentYear} Edelweiss. All rights reserved. Developed by Dhruv Daftary, Jatin Saraf and Shreeja Ravikumar</p>
      </footer>
    </div>
  );
};

export default App;//Exporting the main component