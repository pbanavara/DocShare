const WebSocketServer = require('ws');
const wss = new WebSocketServer.Server({ port: 8000 });

class ReplicatedHashTable {

  constructor() {
    this.table = new Array(127);
    this.size = 0
  }

  /**
   * The hash this value returns can be an index into a server_id. 
   * We can look up that server id in another map to find out 
   * the actual server IP/domain and push the data packet to that machine. 
   * 
   * @param {key to insert} key 
   * @returns the hash index of the array or the server id.
   */
  _hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash += key.charCodeAt(i);
    }
    console.log(hash);
    return hash % this.table.length;
  }

  set(key, value) {
    const index = this._hash(key);
    console.log("The set index is ", index);
    this.table[index] = [key, value];
    this.size++;
  }

  get(key) {
    const index = this._hash(key);
    console.log("The get index is ", index);
    return this.table[index][1];
  }

  remove(key) {
    const index = this._hash(key);
    if (this.table[index] && this.table[index].length) {
      this.table[index] = [];
      this.size--;
      return true;
    } else {
      return false;
    }
  }
}

/**
 * This is the master class to represent an array of ReplicatedHashMaps.
 * Each HashMap at the specific index belongs to a client.
 * When the client sets a key in it's map, it gets reflected in the map
 * at it's specific index.
 */
class Master {
  constructor() {
    // For now, let's take the number of clients supported as 10,000
    this.masterArray = new Array(10000);
    for (let i = 0; i < this.masterArray.length; ++i) {
      this.masterArray[i] = new ReplicatedHashTable();
    }
    this.clientToIndexMap = new Map();
    this.startIndex = 0;
  }

  /**
   * Given a client or user id return an index. This index will be
   * used to store the replicatedHashMap for the client.
   * @param {ID of the client} clientId 
   * @returns 
   */
  getClientHash(clientId) {
    let hash = 0;
    for (let i = 0; i < clientId.length; ++i) {
      hash += clientId.charCodeAt(i);
    }
    return hash % this.masterArray.length;
  }

  getMapAtIndex(index) {
    return this.masterArray.at(index);
  }

  setMapAtIndex(index, map) {
    this.masterArray[index] = map;
  }
}

let masterTable = new Master();

// From the incoming request hash the server id modulo 10000 or the length of t

wss.on("connection", (ws, req) => {
  console.log(req.headers);
  let address = req.headers['user-agent'];
  console.log("Address is ", address);
  // Get the array index for the client with req.address
  index = masterTable.getClientHash(address);
  let replicatedMap = masterTable.getMapAtIndex(index);
  replicatedMap = masterTable.getMapAtIndex(index);

  ws.on("message", data => {
    //console.log(`Client has sent us: ${data}`)
    data = JSON.parse(data);

    replicatedMap.set(data['key'], data['value']);

    // Just to verify that the data is written
    masterTable.setMapAtIndex(index, replicatedMap);
    console.log("Replicated data ", masterTable.getMapAtIndex(index).get(data['key']));
    ws.send(JSON.stringify({ "result": "ok" }));
  });
  // handling what to do when clients disconnects from server
  ws.on("close", () => {
    console.log("the client has connected");
  });
  // handling client connection error
  ws.onerror = function () {
    console.log("Some Error occurred")
  }
});

console.log("Main server started");