//NOTES:
//Service workers can't access anything on the angular app (services and all), since it runs on a separate thread from the main one the angular runs on.

//The following happens here:

//A request repeater (Background Sync) as soon as it detects a wifi (since the request will be successful by them since it has connection na)
//     -Request on the buffer (IndexedDB) needs to be SEQUENTIALLY done, so requests must run on singular async function as a whole, but the requests themselves will wait in a queue.

importScripts('https://cdn.jsdelivr.net/npm/dexie@latest/dist/dexie.js');
importScripts('./ngsw-worker.js');

token = "";

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing Service Worker Mordekaise! ...', event);
    self.skipWaiting();
  });
  
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating Service Worker ....', event);
    return self.clients.claim();
});

self.addEventListener('sync', event => {
    console.log('Sync event fired:', event.tag);
    if (event.tag === 'queue-data') {
        event.waitUntil(indexedFetch());
        // event.waitUntil(temporaryRequestBuffer());
    }
});

self.addEventListener("push", e => {
    self.registration.showNotification("Requests have been synced.", { body: e.data.text() })
})


//Receiver of jwt
addEventListener("message", (event) => {
    token = event.data;
    // console.log(`Message received: ${token}`);
});

//Fetches current request queue on indexeddb.
function indexedFetch(){
    let db;
    //Starts up a request to open db
    const request = indexedDB.open('888-Hardware-DB');

    request.onerror = (event) => {
        console.log('Error occurred while opening the database');
    }
    request.onsuccess = (event) => {
        db = event.target.result;
        transaction = db.transaction('requestLists', 'readwrite');
        objectStore = transaction.objectStore('requestLists');
        console.log("DB ObjectStore found");
        cacheFlusher(objectStore, db);
    }
}

//Sequentially iterates through the fetched requestList, and sends it to a filter tunnel for http requests
function cacheFlusher(obj, db){
    console.log("Flushing cache...");
    const getAllRequest = obj.getAll();

    getAllRequest.onerror = (event) => {
        console.log('Error occurred while getting all data');
    };

    getAllRequest.onsuccess = async (event) => {
        const allData = getAllRequest.result;

        //Iterates through all requests
        for (const data of allData) {
            try {
                //Await so each request is sequentially done.
                switch (data.requestType) {
                    case 'POST':
                        await postData(data);
                        break;

                    case 'PATCH':
                        await editData(data);
                        break;
                
                    case 'DELETE':
                        await deleteData(data);
                        break;
                
                    default:
                        break;
                }
                // Delete synced record in indexeddb.
                deleteDataFromStore(db, data.id);

            } catch (error) {
                console.error('Error occurred while posting data:', error);
            }
        }

        // Notify main thread that sync is finished
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                success: true
            });
        });
    };
}

function postData(message) {
    return new Promise((resolve, reject) => {
        fetch('https://green-anteater-976545.hostingersite.com/888-Hardware-Trading/API-hardware-trading/main/addProduct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(message.package)
        })
        .then(data => {
            console.log('Message posted successfully to sync');
            resolve(data);
        })
        .catch(error => {
            console.log('Error occurred, retrying...', error);
            reject(error);
        });

    })
}

function editData(message) {
    return new Promise((resolve, reject) => {
        fetch('https://green-anteater-976545.hostingersite.com/888-Hardware-Trading/API-hardware-trading/main/' + message.package[1], {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(message.package[0])
        })
        .then(data => {
            console.log('Message posted successfully to sync');
            resolve(data);
        })
        .catch(error => {
            console.log('Error occurred, retrying...', error);
            reject(error);
        });

    })
}

function deleteData(data) {
    return new Promise((resolve, reject) => {
    
        fetch('https://green-anteater-976545.hostingersite.com/888-Hardware-Trading/API-hardware-trading/main/' + data.package[1] + '/' + data.package[0], {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        })
        .then(data => {
            console.log('Message deleted successfully to sync');
            resolve(data);
        })
        .catch(error => {
            console.log('Error occurred, retrying...', error);
            reject(error);
        });

    })
}

function deleteDataFromStore(db, id) {
    const transaction = db.transaction(['requestLists'], 'readwrite');
    const objectStore = transaction.objectStore('requestLists');
    objectStore.delete(id);

    transaction.oncomplete = function() {
        broadcastChange({ type: 'delete', id: id });
    };
}

function broadcastChange(message){
    const broadcast = new BroadcastChannel('dexie-updates');
    broadcast.postMessage(message);
}