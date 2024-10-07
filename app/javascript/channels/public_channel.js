import consumer from "channels/consumer"

let latitude;
let longitude;
let subscription;
let watchId;
let lastupdateTime = new Date();

function connection() {
  const connectLink = document.getElementById('connect-link')
  const form = document.getElementById('whole-form');
  // const disconnectLink = document.getElementById('disconnect-link')
  connectLink.addEventListener('click', (event) => {
    event.preventDefault();

    if (!subscription) {
      subscription = consumer.subscriptions.create("PublicChannel",  {
        connected() {
          console.log('リアルタイム通信が繋がりました');
          // Called when the subscription is ready for use on the server
          fetch(`/entry/${currentUserId}`, { 
            method: 'PATCH',
            headers: {
              'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: new FormData(form)
          })
          .then(response => response.text())
          .then(html => {
            document.documentElement.innerHTML = html
            showGoogleMap();
            prepareDisconnection();
          })

        },

        disconnected() {
          // Called when the subscription has been terminated by the server
          console.log('リアルタイム通信への接続がきれました')
        },

        received(data) {
          // Called when there's incoming data on the websocket for this channel
          console.log(data)
          displayMatchInfo(data);
        }
      });
   } 
  });
} 

function prepareDisconnection() {
  const disconnectLink = document.getElementById('disconnect-link');

  disconnectLink.addEventListener('click', (event) => {
    event.preventDefault();
    consumer.connection.close();
    subscription = null;
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

function showGoogleMap() {
  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
  key: "AIzaSyCduQ2F4MLs5vF2I0BKKEqYJmDxA2Yq1QU",
  v: "weekly",
  // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
  // Add other bootstrap parameters as needed, using camel case.
  });

  async function initMap() {
    let pos = { lat: latitude, lng: longitude};
    const myImage = document.getElementById("my_image")
    const { Map } = await google.maps.importLibrary('maps')
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')

    let map = new Map(document.getElementById('map'), {
      mapId: "3c6f58db644be140",
      center: pos,
      zoom: 15,
      disableDefaultUI: true
    })
    
    let myLocation = new AdvancedMarkerElement({
      map,
      position: pos,
      content: myImage
    })
  }

  initMap();
}

function displayMatchInfo(data) {
  let matchElement = document.createElement('div');
  matchElement.innerHTML = `<h3>マッチしました!</h3><p>${data.user.name},${data.age}</p><button>今すぐ会う</input>`
  document.body.appendChild(matchElement)
}

function locationWatching() {
  const allowlink = document.getElementById('get-position-btn');

  allowlink.addEventListener('click', (event) => { 
    event.preventDefault();

    if( navigator.geolocation )
      {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            let currentTime = Date.now();
            if(currentTime - lastupdateTime > 15) {
              let data = position.coords ;
              latitude = data.latitude;
              longitude = data.longitude;
              let patch_data = { user: {
                id: currentUserId, 
                latitude: latitude,
                longitude: longitude
              } };

              fetch('/update_location', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify(patch_data)
              })
              .then(() => {
                console.log('位置情報の更新に成功')
                if(document.getElementById('location-result')) {
                  document.getElementById('location-result').textContent = '位置情報が許可されています'
                }
              })
              .catch(error => console.log(error));
              lastupdateTime = currentTime
            }
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
          },
          { 
            "enableHighAccuracy": false
          }
       );
      }
      
      else
      {
        var errorMessage = "お使いの端末またはブラウザは位置情報の取得ができません。";
      
        alert( errorMessage );
      
        document.getElementById('location-result').innerHTML = errorMessage;
      }

  })
}

document.addEventListener('DOMContentLoaded', () =>{
  if (document.getElementById('location-result')) {
    if (latitude && longitude) {
      document.getElementById('location-result').textContent = '位置情報が許可されています'
    } else {
      document.getElementById('location-result').textContent = '位置情報を許可してください'
    }
  }

  if (document.getElementById('get-position-btn')) {
    locationWatching();
  }

  if (document.getElementById('connect-link')) {
    connection();
    console.log('リロードによりWebSocket接続が可能になりました')
  }

  if (document.getElementById('map')) {
    showGoogleMap();
  }

  document.addEventListener('turbo:load', () => {
    if (document.getElementById('connect-link')) {
      connection();
      console.log('ページ遷移によりWebSocket通信が可能になりました')
    }

    if (document.getElementById('location-result')) {
      if (latitude && longitude) {
        document.getElementById('location-result').textContent = '位置情報が許可されています'
      } else {
        document.getElementById('location-result').textContent = '位置情報を許可してください'
      }
    }
  
    if (document.getElementById('get-position-btn')) {
      locationWatching();
    }
  })

  window.addEventListener('popstate', () => {
    if(subscription){
      consumer.connection.close();
      subscription = null;
    }
  })
})






