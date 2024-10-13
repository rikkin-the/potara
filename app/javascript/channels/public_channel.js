import consumer from "channels/consumer"

let latitude;
let longitude;
let subscription;
let watchId;
let privateSubscription;
let locationSubscription;
let map;
let MarkerClass;
let myLocation;
let partnerImageUrl;

async function fetchForSql(f) {
  const response = await fetch(`/entry/${currentUserId}`, { 
    method: 'PATCH',
    headers: {
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: new FormData(f)
  })
  const html = await response.text()
  document.documentElement.innerHTML = html
}

function locationWatching(){
  return new Promise(function(resolve, reject){
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        let data = position.coords 
        latitude = data.latitude
        longitude = data.longitude
        if(map && myLocation) {
          map.setCenter({lat: latitude, lng: longitude})
          myLocation.position = {lat: latitude, lng: longitude}
          console.log('reset location')
        }
        let patch_data = { user: {
          id: currentUserId, 
          latitude: latitude,
          longitude: longitude
        } }
        fetchForRedis(patch_data)
        resolve();
      },
      (error) => {
        const errorInfo = [
          "原因不明のエラーが発生しました…。" ,
          "位置情報の取得が許可されませんでした…。" ,
          "電波状況などで位置情報が取得できませんでした…。" ,
          "位置情報の取得に時間がかかり過ぎてタイムアウトしました…。"
        ] ;

        var errorNo = error.code ;
        var errorMessage = errorInfo[ errorNo ];
        alert( errorMessage );
        document.getElementById("location-result").textContent = errorMessage;
        reject();
      },
      {
        "enableHighAccuracy": true
      } 
    );
  })
}

async function fetchForRedis(patch_data = {}) {
  let response = await fetch('/update_location', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: JSON.stringify(patch_data)
  })
  let response_data = await response.json()
  console.log(response_data)
}

async function showGoogleMap() {
  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
  key: "AIzaSyCduQ2F4MLs5vF2I0BKKEqYJmDxA2Yq1QU",
  v: "weekly",
  // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
  // Add other bootstrap parameters as needed, using camel case.
  });

  async function initMap() {
    let pos = { lat: latitude, lng: longitude};
    const myImage = document.getElementById("my-image")
    const { Map } = await google.maps.importLibrary('maps')
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
    MarkerClass = AdvancedMarkerElement

    map = new Map(document.getElementById('map'), {
      mapId: "3c6f58db644be140",
      center: pos,
      zoom: 15,
      disableDefaultUI: true
    })
    
    myLocation = new MarkerClass({
      map,
      position: pos,
      content: myImage
    })
  }

  initMap();
}

function prepareDisconnection() {
  const disconnectLink = document.getElementById('disconnect-link');

  disconnectLink.addEventListener('click', (event) => {
    event.preventDefault();
    subscription.unsubscribe();
    subscription = null;
    consumer.connection.close();
    navigator.geolocation.clearWatch(watchId);
    fetch('/exit', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
      },
      body: JSON.stringify({id: currentUserId})
      })
    .then(response => response.json())
    .then((data) => {
      window.location.href = data.redirect_url
    })
  })
}

async function executeInTurn(f){
  await fetchForSql(f);
  console.log('リアルタイム通信成功');
  await locationWatching();
  console.log('位置情報の取得開始')
  showGoogleMap();
  prepareDisconnection();
} 

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function removeInfo() {
  console.log('timeover')
  let matchInfoElement = document.getElementById('match-info')
  let lists = ['name' , 'age',  'distance']
  for ( let i = 0; i < lists.length; i++ ){
    document.getElementById(lists[i]).textContent = null;
  }
  document.getElementById('her-his-image').removeAttribute('src')
  matchInfoElement.style.display = 'none'
}

async function removeInfoWithDelay() {
  await delay(45000)
  removeInfo()
}

function displayMatchInfo(data) {
  partnerImageUrl = data.image
  let matchInfoElement = document.getElementById('match-info')
  let nameElement = document.getElementById('name') 
  let ageElement = document.getElementById('age')
  let distanceElement = document.getElementById('distance')
  let imageElement = document.getElementById('her-his-image')
  let agreementElement = document.getElementById('agreement')
  nameElement.textContent = data.user.name
  ageElement.textContent = data.age
  distanceElement.textContent = `${data.distance}m先`
  imageElement.src = partnerImageUrl
  matchInfoElement.style.display = 'block'
  agreementElement.addEventListener('click', () => {
    let agreement_params = { like_id: currentUserId, liked_id: data.user.id }
    subscription.send(agreement_params)
  })
  removeInfoWithDelay()
}

function prepareForSending() {
  const messageInputElement = document.getElementById('message')
  const formElement = document.getElementById('form')

  formElement.addEventListener('submit', (event) => {
    event.preventDefault()
    privateSubscription.send({ message: messageInputElement.value })
    messageInputElement.value = null;
  })

}

async function connection() {
  const connectLink = document.getElementById('connect-link')
  const form = document.getElementById('whole-form');

  connectLink.addEventListener('click', (event) => {
    event.preventDefault();

    function subscribePublicChannel() {
      subscription = consumer.subscriptions.create("PublicChannel",  {
        connected() {
          console.log("パブリック通信開始")
          executeInTurn(form)
        },
        disconnected() {
        },
        received(data) {
          if(typeof(data) === 'object') {
            displayMatchInfo(data);
          } else if(typeof(data) === 'number') {
            subscription.unsubscribe();
            subscription = null;
            privateSubscription = consumer.subscriptions.create({channel: 'PrivateChannel', first_like_id: data}, {
              connected() {
                const chatElement = document.getElementById('chat')
                const partnerImageElement = document.getElementById('partner-image')
                const unmatchElement = document.getElementById('unmatch')
                
                console.log('start private')
                removeInfo();
                prepareForSending();
                chatElement.style.display = 'block'
                partnerImageElement.src = partnerImageUrl
                unmatchElement.addEventListener('click', (event) => {
                  event.preventDefault()
                  privateSubscription.unsubscribe()
                  locationSubscription.unsubscribe()
                  privateSubscription = null
                  locationSubscription = null
                  consumer.connection.close()
                  navigator.geolocation.clearWatch(watchId)
                  async function exitToEntry() {
                    const response =  await fetch('/exit', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                      },
                      body: JSON.stringify({id: currentUserId})
                    })
                    const data = await response.json()
                    window.location.href = data.redirect_url
                  }
                  exitToEntry();
                })
              }, 

              disconnceted() {
              }, 

              received(partnerData) {
                console.log(partnerData)
                if(typeof(partnerData) == 'number') {
                  const chatElement = document.getElementById('chat')
                  const partnerImageElement = document.getElementById('partner-image')

                  privateSubscription.unsubscribe()
                  locationSubscription.unsubscribe()
                  privateSubscription = null
                  locationSubscription = null
                  chatElement.style.display = 'none'
                  partnerImageElement.src = ""
                  partnerImageElement.style.display = 'none'
                  partnerImageUrl = null
                  subscribePublicChannel();
                } else {
                const chatDisplayElement = document.getElementById('chat-display')
                let newElement = document.createElement('p')
                newElement.textContent = partnerData.message
                chatDisplayElement.appendChild(newElement) 
                }
              } 
            })
            
            locationSubscription = consumer.subscriptions.create('LocationChannel', {
              connected() {
                console.log('start receiveing location')
              },
              disconnected() {
              },
              received(data) {
                const partnerImageElement = document.getElementById('partner-image')
                partnerImageElement.style.display = 'inline'
                let partnerLocation = new MarkerClass({
                  map,
                  position: data,
                  content: partnerImageElement
                })
              }
            })
          }
        }
      })
    }
    subscribePublicChannel();

  });
} 



document.addEventListener('DOMContentLoaded', () =>{

  if (document.getElementById('connect-link')) {
    connection();
    console.log('リロードによりWebSocket接続が可能になりました')
  }

  document.addEventListener('turbo:load', () => {
    if (document.getElementById('connect-link')) {
      connection();
      console.log('ページ遷移によりWebSocket通信が可能になりました')
    }
  })

  window.addEventListener('popstate', () => {
    if(subscription){
      consumer.connection.close();
      subscription = null;
      navigator.geolocation.clearWatch(watchId)
    }
  })
})






