
const http = require("http");
var express = require('express');
const path = require("path");
const bodyParser = require('body-parser');

var app = express();

var mongoose = require("mongoose");
const { resolveSoa } = require("dns");
const mongoConnectionURL = ""
const databaseName = "dominion";
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: databaseName
}

// const serverSocket = http.createServer(app);
// const socket = require("./server-socket");


const debugPrints = false

mongoose.connect(mongoConnectionURL, options)
  .then(() => console.log("Connected."))
  .catch((error) => console.log('Error connecting to MongoDB '+error));
const reactPath = path.resolve(__dirname, "..", "build");
app.use(express.static(reactPath));
app.use(express.static(path.resolve(__dirname,"..",'build/images'), {
  maxAge: 60*60*1000
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const UserSchema = new mongoose.Schema({
  name: String,
  state: Object,
  select: Object,
  hand: [Number],
  deck: [Number],
  phase: Number,
  discard: [Number],
  logs: [Object]
});

const RecordSchema = new mongoose.Schema({
  users: [Object]
})

const User = mongoose.model("User", UserSchema);
const Record = mongoose.model("Record", RecordSchema);

const cards = ['cellar', 'chapel', 'moat', 'harbinger', 'merchant', 'vassal', 'village', 'workshop', 'bureaucrat', 'gardens', 'militia', 'moneylender', 'poacher', 'remodel', 'smithy', 'throne-room', 'bandit', 'council-room', 
    'festival', 'laboratory', 'library', 'market', 'mine', 'sentry', 'witch', 'artisan',
    'courtyard', 'lurker', 'pawn', 'masquerade', 'shanty town', 'steward', 'swindler',
    'wishing well', 'baron', 'bridge', 'conspirator', 'diplomat', 'ironworks', 'mill',
    'mining-village', 'secret-passage', 'courtier', 'duke', 'minion', 'patrol', 'replace',
    'torturer', 'trading post', 'upgrade', 'harem', 'nobles'
]
const bigcards = ['cellar', 'chapel', 'moat', 'harbinger', 'merchant', 'vassal', 'village', 'workshop', 'bureaucrat', 'gardens', 'militia', 'moneylender', 'poacher', 'remodel', 'smithy', 'throne-room', 'bandit', 'council-room', 
    'festival', 'laboratory', 'library', 'market', 'mine', 'sentry', 'witch', 'artisan',
    'courtyard', 'lurker', 'pawn', 'masquerade', 'shanty-town', 'steward', 'swindler',
    'wishing-well', 'baron', 'bridge', 'conspirator', 'diplomat', 'ironworks', 'mill',
    'mining-village', 'secret-passage', 'courtier', 'duke', 'minion', 'patrol', 'replace',
    'torturer', 'trading-post', 'upgrade', 'harem', 'nobles', 'copper', 'curse', 'estate',
    'silver', 'duchy',  'gold', 'province' 
]

const prices = [2,2,2,3,3,3,3,3,4,4,4,4,4,4,4,4,5,5,
5,5,5,5,5,5,5,6,
2,2,2,3,3,3,3,
3,4,4,4,4,4,4,
4,4,5,5,5,5,5,
5,5,5,6,6,0,0,2,
3,5,6,8]

let currentKingdom = []//0,1,15,30,22]

app.get("/corgi", function(req, res) {
    res.send("Who's a good doggie");
})

app.get("/api/add", (req, res) => {
  let newUser = new User({
      name: req.query.name,
      state:[],
      hand: [],
      deck: [],
      discard: []
  })

  newUser.save().then((user) => {
    console.log("Added "+user.name);
    res.send(user)
  })
})


app.get("/api/getUser", (req, res) => {
  console.log("Request for data for "+req.query.name)
  User.findOne({name: req.query.name}).then(
    (user) => {
      console.log("Retrieved "+user.name);
      res.send(user)
    }
  )
})

app.get("/api/getKingdom", (req, res) => {
  console.log("Request for kingdom data")
  Record.findOne({}).then((record)=>
  {
    if(!record)
    {
      res.send({"kingdomCards": currentKingdom})
      console.log("Kingdom obtained")
    }
    else res.send({"kingdomCards": record.users[record.users.length-1]}).then(console.log("Kingdom obtained"))
  }
  )
})

app.get("/api/getUsers", (req, res) => {
  console.log("getUsers endpoint reached")
  User.find({}).then((users)=> {
    let arr = []
    users.forEach(user => arr.push(user.name))
    res.send({"users": arr})
    console.log("Users successfully gotten "+arr)
  })
})


const getKingdom = (includes, excludes) => 
{

    var kingdom = []
    includes.forEach((card)=>{kingdom.push(bigcards.indexOf(card.replace(" ","-")))})

    while(kingdom.length<10)
    {
      var idx = Math.floor(Math.random() * cards.length)
      if(kingdom.indexOf(idx) >= 0 || excludes.indexOf(cards[idx]) >= 0) continue
      else kingdom.push(idx)
    }

    return kingdom
}




app.post("/api/startGame", (req, res) => {
  const initialState = {turn: "", turnCt:1, actions: 1, buys: 1, coins: 0, waiting: "", kingdom: [],
    supply: [10,10,10,10,10,10,10,10,10,10,8,30,8,40,8,60,20], playedCards: [], throneMe: [], maskedCard: -1,numMerchants:0, numBridges: 0, trash: [], vps: []}

  const initialSelect = {type: "", number: 0, selected:[], upTo: true}
  if(req && req.body && req.body.userList && req.body.cardIncludes && req.body.cardExcludes) console.log("starting game")
  else {
    console.log("Error starting game")
    res.send("error starting game")
  }
  // console.log(req.body.userList)
  console.log(req.body)
  var ct = 0

  User.deleteMany({}).then(() => {
    console.log("deleted previous users")
    }
  ).then(() => {
    Record.deleteMany({}).then(() => {
    console.log("deleted previous record")
    }
  )}).then(() => {

    currentKingdom = getKingdom(req.body.cardIncludes, req.body.cardExcludes)
    currentKingdom = currentKingdom.sort((a,b) => prices[a]-prices[b])

    let firstState = initialState;
    firstState.kingdom = currentKingdom;
    let tcs = ['mill','duke','harem','nobles','gardens']

    for(var i=0; i<10; i++) if(tcs.includes(bigcards[currentKingdom[i]])) firstState.supply[i] = 8;
    if(req.body.userList.length>2)
      for(var i=0; i<16; i++) if(firstState.supply[i]==8) firstState.supply[i] = 12;
    firstState.supply[16]=(req.body.userList.length-1)*10;
    (req.body.userList.sort((a,b)=>a.localeCompare(b)))
    firstState.waiting = firstState.turn = req.body.userList[Math.floor(Math.random()*req.body.userList.length)]

    var isFirst = true
    users = []
    req.body.userList.forEach((user) => {
      var numCoppers = 2+Math.floor(3*Math.random())
      var initHand = []
      var initDeck = []
      for(var i=0; i<numCoppers; i++) initHand.push(bigcards.indexOf('copper'))
      for(var i=0; i<5-numCoppers; i++) initHand.push(bigcards.indexOf('estate'))
      for(var i=0; i<7-numCoppers; i++) initDeck.push(bigcards.indexOf('copper'))
      for(var i=0; i<3-(5-numCoppers); i++) initDeck.push(bigcards.indexOf('estate'))
      let obj = {
        name: user,
        deck: initDeck,
        hand: initHand,
        select: initialSelect,
        discard: [],
        phase: 0,
        state: firstState,
        logs: []
      }
      let newUser = new User(obj)

      users.push(obj)

      newUser.save().then((user) => {
        console.log("Added "+user.name+" "+user.hand);
        
        ct += 1
        if(ct == req.body.userList.length) {
          let newRecord = new Record({users: [...users]})
          newRecord.save().then((_) => {
            res.send({"status": "success!"});
          })
        }
      })
      isFirst = false
    })


  })
})


app.get("/delete", (req, res) => {
  User.deleteMany({}).then(() => {
    console.log("deleted previous users")
    }
  ).then(() => {
    Record.deleteMany({}).then(() => {
    console.log("deleted previous record")
    }
  )})
})

app.post("/api/update", (req, res) => {
  console.log("Update request received from "+req.body.record.name)
  Record.findOne({}).then((record)=>
  {
    if(!record)
    {
      let newRecord = new Record({users: [req.body.record]})
      newRecord.save()
    }
    else {
      // console.log(record.id)
      // console.log(req.body.record)
      // console.log(record.users)
      record.users = [...record.users,req.body.record]
      record.save().then((savedRecord) => {
        console.log("Update request successful for "+req.body.record.name)
        console.log("ID "+savedRecord.id)
      })
    }    
  }
  )
})

app.post("/api/undo", (req, res) => {
  console.log("Undo request by "+req.body.user+" undesLen "+req.body.undesLen)
  Record.findOne({}).then((record)=> {
    if(!record) {
      console.log("No record found in undo request :(");
      return;
    }
    let ct = 0;
    for(var i=record.users.length-1; i>=0; i--)
    {
      if(record.users[i].state.waiting == req.body.user)
      {
        if(req.body.undesLen<0 || record.users[i].state.playedCards.length != req.body.undesLen)
        {
          console.log("Went "+(record.users.length-i)+" records back")
          record.users.splice(i+1);
          record.save().then((savedRecord) => {
            res.send({status: "Successful undo"})
            console.log("Successful undo for "+req.body.user)
          })
          break;
        }
        else ct+=1
      }
      else
      {
        console.log(record.users[i].name+", turn "+record.users[i].state.turnCt+" "+record.users[i].hand)
      }
    }
  })
})

app.get("/api/getState", (req, res)=> {
  console.log("Request for state data for "+req.query.name)

  Record.findOne({}).then((record)=> {
    if(!record) {
      console.log("No record found :(");
      User.deleteMany({}).then(() => {
        console.log("deleted previous users")
        }
      ).then(() => {
        Record.deleteMany({}).then(() => {
        console.log("deleted previous record")
        }
      )});
      return;
    }
    else console.log("Records found...")
    let latestState = record.users[record.users.length-1].state
    let latestLogs = record.users[record.users.length-1].logs
    for(var i=record.users.length-1; i>=0; i--)
    {
      if(record.users[i].name == req.query.name)
      {
        console.log("Retrieved "+record.users[i].name);
        res.send({...record.users[i],
         state: latestState,
         logs: latestLogs
        });
        return;
      }
      else console.log(record.users[i].name)
    }
  })
})

app.get("*", function(req, res) {
  res.sendFile(path.join(reactPath, "index.html"));
})


app.use((err, req, res, next) => {
  const status = err.status || 500;
  if(status==500)
  {
    console.log("Server errored when processing Shree's request");
    console.log(err);
  }

  res.status(status);
  res.send({
    status: status,
    message: err.message
  });
})

const port = 5000;
const server = http.Server(app);

const io = require('socket.io').listen(server);

const del = () => {
  User.deleteMany({}).then(() => {
    console.log("deleted previous users")
    }
  ).then(() => {
    Record.deleteMany({}).then(() => {
    console.log("deleted previous record")
    }
  )})
}

io.on('connection', (socket) => {
  console.log('a user connected');
  // del()
  io.emit('sendstatus', '');
  socket.on('ready', (msg) => {
    // console.log("is this "+socket.username);
    socket.username = msg
    console.log(msg+" ready")
    io.emit('ready', msg);
  })

  socket.on('not ready', (msg) => {
    socket.username = msg
    console.log(msg+" not ready")
    io.emit('not ready', msg);
  })

  socket.on('disconnect', () => {
    console.log('user '+socket.username+' disconnected');
    io.emit('departed', socket.username)
  })

  socket.on('gametime', (msg) => {
    console.log('gametime baby');
    io.emit('gametime', '');
  })

  socket.on('otherstate', (data) => {
    console.log('broadcasting state baby from '+socket.username)
    socket.broadcast.emit('otherstate', data)
  })

  socket.on('message', (data) => {
    io.emit('message', data);
  })

  socket.on('log', (data) => {
    io.emit('log', data);
  })

  socket.on('gg', (data) => {
    console.log("gg processed")
    io.emit('gg', data);
  })

  socket.on('my-stats', (data) => {
    console.log("stats processed")
    io.emit('my-stats', data);
  })

  socket.on('refetch', (data) => {
    console.log("refetch processed");
    io.emit('refetch', data);
  })

  socket.on("/api/update", (data) => {
    if(debugPrints) console.log(data)
    console.log("Update request received from "+data.record.name)
    Record.findOne({}).then((record)=>
    {
      if(!record)
      {
        let newRecord = new Record({users: [data.record]})
        newRecord.save()
      }
      else {
        record.users = [...record.users,data.record]
        record.save().then((savedRecord) => {
          console.log("Update request successful for "+data.record.name)
          console.log("ID "+savedRecord.id)
        })
      }    
    }
    )




  })
})

server.listen(process.env.PORT || port, () => {
  console.log("Server running on port: ${port}");
})