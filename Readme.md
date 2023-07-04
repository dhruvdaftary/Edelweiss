# TCP/IP Data Packet Collection and Processing Project
## Edelweiss Hackthon

This project aims to collect data packets from a TCP/IP server, process the collected data on a Node.js backend, and display the processed output in a React frontend. The application serves as an example of how to handle real-time data streams and visualize the processed data using modern web technologies.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies Used](#technologies-used)
- [Team](#team)

## Introduction

In today's digital world, data transmission and real-time processing are vital components of various applications. This project demonstrates a simple setup to collect data packets from a TCP/IP server, process the incoming data on a Node.js backend, and present the results using a React frontend.

The system involves three main components:

👉 TCP/IP Server: The data source that generates and sends data packets over a TCP/IP connection.
👉 Node.js Backend: Responsible for receiving, processing, and storing the data packets in a suitable format.
👉 React Frontend: Displays the processed data in a user-friendly way, enabling users to interact with the real-time data stream.



## Features 💡

👉 Collects data packets from a TCP/IP server.
👉 Processes the data packets on the Node.js backend.
👉 Real-time data processing and visualization in the React frontend.
👉 Simple and modular architecture for easy understanding and extendibility.

## Installation 🖥

To set up the project on your local machine, follow the steps below:

1. Clone the repository:

bash
git clone 


2. Navigate to the project directory:

bash
cd dir


3. Install dependencies for both backend and frontend:

bash
cd backend
npm install
cd ../frontend
npm install


4. Configure TCP/IP Server settings:

Edit the `server.config.js` file in the `backend` directory to set up the TCP/IP server's connection details, such as host and port.

## Usage

### Start the Backend Server

1. Go to the `backend` directory:

bash
cd backend


2. Start the Node.js server:

bash
npm start


The backend server should now be running and ready to accept incoming data packets from the TCP/IP server.

### Start the Frontend Application

1. Go to the `frontend` directory:

bash
cd frontend


2. Start the React development server:

bash
npm start


The frontend application should now be accessible at `http://localhost:3000/`, where you can view the real-time data processing.

## Technologies Used

📦 TCP/IP
📦 Node.js
📦 Express.js
📦 React
📦 WebSocket
📦 Net
📦 JavaScript/ES6+
📦 HTML5
📦 CSS3

## Team

To make this project a great success the following are the contributors:

💻 Dhruv Daftary
💻 Shreeja Ravikumar
💻 Jatin Saraf

made with 💖 from 