const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
require('dotenv').config()
// console.log(process.env.MONGODB_CONNECTION_STRING) // remove this after you've confirmed it working
const { MongoClient } = require("mongodb");
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {

    res.sendFile(__dirname + '/index.html');
   
});

server.listen(3000, () => {
 console.log('listening on *:3000');
});

const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);  // remove this after you've confirmed it working

async function run() {

  try {

    await client.connect();
    const database = client.db('chat');
    const messages = database.collection('messages');

    // // Query for our test message:
    // const query = { message: 'Hello from MongoDB' };
    // const message = await messages.findOne(query);
    // console.log(message);

    // open a Change Stream on the "messages" collection
    changeStream = messages.watch();

       // set up a listener when change events are emitted
       changeStream.on("change", next => {
           // process any change event
                //    switch (next.operationType) {
                //        case 'insert':
                //            console.log(next.fullDocument.message);
                //            break;
                //        case 'update':
                //            console.log(next.updateDescription.updatedFields.message);
                //    }

           switch (next.operationType) {
            case 'insert':
                io.emit('chat message', next.fullDocument.message);
                console.log(next.fullDocument.message);
                break;

            case 'update':
                io.emit('chat message', next.updateDescription.updatedFields.message);
                console.log(next.updateDescription.updatedFields.message);
        }
       });    

  } catch {

    // Ensures that the client will close when you error
    await client.close();
  }
}

run().catch(console.dir);
