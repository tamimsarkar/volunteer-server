const express = require('express')
const bodyParser = require('body-parser')
require('dotenv').config()
const admin = require('firebase-admin');
const cors = require('cors')
const ObjectID = require('mongodb').ObjectID
const MongoClient = require('mongodb').MongoClient;


const app = express()
const port = 4000

// modddleware
app.use(cors())
app.use(bodyParser.json());

var serviceAccount = require("./configs/volunteer-67c35-firebase-adminsdk-im7cc-725e65599e.json");

// firebase Admin


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_FIRE
});
//MongoDB


var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.iwehv.mongodb.net:27017,cluster0-shard-00-01.iwehv.mongodb.net:27017,cluster0-shard-00-02.iwehv.mongodb.net:27017/volunteerEvents?ssl=true&replicaSet=atlas-w82rim-shard-0&authSource=admin&retryWrites=true&w=majority`;
MongoClient.connect(uri, function(err, client) {
  const collection = client.db('volunteerEvents').collection('events');
  const registerCollection = client.db('volunteerEvents').collection('registers');
    
  app.get('/events' ,(req,res) => {
      collection.find({})
      .toArray((err,documents) => {
          res.send(documents)
      })
  })
  
  // Get registers
  app.get('/registers' , (req,res) => {
    const bearer = req.headers.authorization;
        if(bearer && bearer.startsWith('Bearer ')){
            const idToken = bearer.split(' ')[1]
           
        admin.auth().verifyIdToken(idToken)
            .then(function (decodedToken) {
                const tokenEmail = decodedToken.email;
                const queryEmail = req.query.email;
                if(tokenEmail == queryEmail){

                    registerCollection.find({ email : queryEmail})
                    .toArray((err, documents) => {
                        res.status(200).send(documents)
                    })
                }else{
                    res.status(401).send("un Authorized")
                }
                // ...
            }).catch(function (error) {
                // Handle error
                res.status(401).send("un Authorized...")
            });
        }
        else{
            res.status(401).send("un Authorized")
        }
  })
  // register collection
  app.post('/registers',(req,res) => {
    const newRegister = req.body;
    registerCollection.insertOne(newRegister)
    .then(result => {
      res.send(result.insertedCount > 0)
    })
  })
  app.delete('/delete/:id',(req,res) => {
    registerCollection.deleteOne({_id : ObjectID(req.params.id)})
    .then(result => {
      res.send(result.deletedCount > 0)
    })
  })
  // perform actions on the collection object
});


app.get('/', (req, res) => {
  res.send('This is the volunteer api')
})

app.listen(process.env.PORT || port)