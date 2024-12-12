import consumer from "consumer";
import Cropper from "cropperjs";

console.log("This is the match.js")

// global variables

// lat n lng are not updated.
let lat;
let lng;
let latitude;
let longitude;
let subscription;
let privateSubscription;
let locationSubscription;
let watchId;
let map;
let MarkerClass;
let myLocation;
let stationLocation;
let partnerLocation;
let isAllowed = false;
let isInArea = false;
let cropper;
let audioElement;
let connectLink = document.getElementById('connect-link')
let connectText;
let notificationElement = document.getElementById('popup__javascript')
const currentUserId = document.getElementById('current_user_id').value

let matchInfoElement;
let agreementElement;
let appointmentElement;
let warningElement;
let soundElement;
let loadingScreen;
let loadingScreen2;
let ackYokohama;

// clock direction from a south-west point
const nishiyokohama = {lat: 35.45336890218082, lng: 139.60865604253013}
const mitsuzawa = {lat: 35.47654461293579, lng: 139.61502719928353}
const shijou = {lat: 35.46767597074172, lng: 139.6350742306143}


function deriveLineParameters(pt1, pt2) {
  const a = (pt2['lat']-pt1['lat'])/(pt2['lng']-pt1['lng'])
  const b = pt1['lat']-a*pt1['lng']
  return {a: a, b: b}
}

const leftLine = deriveLineParameters(nishiyokohama, mitsuzawa)
const rightLine = deriveLineParameters(mitsuzawa, shijou)
const bottomLine = deriveLineParameters(shijou, nishiyokohama)

function isInYokohama(lat, lng) {
  function isUnderLine(line) {
    if(lat < line['a']*lng+line['b']) {
      return true
    }
    return false
  }

  if (isUnderLine(leftLine) && isUnderLine(rightLine) && !isUnderLine(bottomLine)) {
    return true
  }
  return false
}

// global function

function removeInfo() {
  console.log('timeover')
  document.getElementById('match-info').style.display = 'none'
  document.getElementById('connect-link').style.display = 'block'
  document.getElementById('loading-screen2').style.display = 'none'
  if(isAllowed) {
    audioElement.pause()
    audioElement.load()
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const alertBeforeUnload= (e) => {
  e.preventDefault
  const message = 'マッチは解除されます。よろしいですか？'
  e.returnValue = message
  return 
}


// main function

const commentElement = document.getElementById('user_comment')
const fileInputElement = document.querySelector('input[type="file"]');
const previewElement = document.getElementById('image-preview');
const addELement = document.querySelector('.add__icon')


// crop file

fileInputElement.addEventListener('change', (event) => {
  const file = event.target.files[0];
  // set add icon back
  addELement.style.zIndex = '-10'

  // for operating file data
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.addEventListener('load', () => {
    previewElement.src = reader.result;

    // Cropperインスタンスがあれば破棄
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }

    // 新しいCropperインスタンスを作成
    cropper = new Cropper(previewElement, {
      aspectRatio: 4 / 5,
      viewMode: 3,
      dragMode: 'none',
      movable: false,
      zoomable: false,
      guides: false,
      center: false,
      autoCropArea: 1.0,
      cropBoxResizable: false
    });
  });
});


// subscribe location

connectLink.addEventListener('click', (event) => {
  event.preventDefault();

  if (!cropper) {
    alert("写真が必要です")
  } else if( commentElement.value.length > 63 ) {
    alert("ひとことは63文字以内です")
  } else {
    subscribeLocation();
    
  }

  function subscribeLocation() {
    locationSubscription = consumer.subscriptions.create('LocationChannel', {
      initialized() {
        executeInTurn();
      },
      received(data) {
        // receive information of a partner after matched
        console.log(data)
        notificationElement.textContent = '相手が移動しています!'
        removeNotification()
        async function removeNotification() {
          await delay(5000)
          notificationElement.textContent = ''
        }
      }
    })


    // being asynchronous is so important
    async function executeInTurn() {
      wrapLoading();
      await updateDatabase();
      // if you don't uplaod an image before subscribe the public channel, you will be rejected. it is for reconnection of public
      subscribePublic();
      // geolocation takes time and lat and lng is needed for the center of Google Map
      await watchCurrent();
      // image should be attached before requesting 'my icon'
      showGoogleMap();
      // I don't know, but it is needed
      if (isInArea) {
        locationSubscription.send({id: currentUserId, latitude: lat, longitude: lng})
      }
    }

    function wrapLoading() {
      const body = document.querySelector('body')
      body.classList.add('loading__wrapper')
      const loadingScreen3 = document.createElement('div')
      loadingScreen3.setAttribute("id", "loading-screen3")
      loadingScreen3.innerHTML = '<div class="spinner"></div>'
      document.querySelector('html').appendChild(loadingScreen3)
    }

    async function watchCurrent() {
      return new Promise(function(resolve, reject) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            // locationData includes latest information. in contrast, latitude and longitude contain the latest version updated
            lat = position.coords.latitude;
            lng = position.coords.longitude;

            if(isInYokohama(lat, lng)) {
              ackYokohama.innerText = 'マッチ範囲内'
              ackYokohama.style.backgroundColor = '#0acffe'
              isInArea = true
              // it's not until you walk about 50m that your location is updated 
              if(Math.abs(latitude - lat) > 0.0005 ||
                  Math.abs(longitude - lng) > 0.0005 || 
                  !latitude) {
                latitude = lat
                longitude = lng
                locationSubscription.send({id: currentUserId, latitude: latitude, longitude: longitude})
                console.log('updated location')
              }
            } else {
              ackYokohama.innerText = 'マッチ範囲外'
              ackYokohama.style.backgroundColor = 'red'
              isInArea = false
              console.log('out of yokohama')
            }
            resolve();
          },
          (error) => {
            const errorInfo = [
              "原因不明のエラーが発生しました…。" ,
              "位置情報の取得が許可されませんでした…。" ,
              "電波状況などで位置情報が取得できませんでした…。" ,
              "位置情報の取得に時間がかかり過ぎてタイムアウトしました…。"
            ] ;;
            console.log(errorInfo[error.code])
            reject()
          },
          {
            "enableHighAccuracy": true
          } 
        );  
      })
    }   

    async function updateDatabase() {
      // conversion to blob takes time
      const blob = await getBlobFromCanvas(cropper)
      function getBlobFromCanvas(c) {
        return new Promise((resolve) => {
          c.getCroppedCanvas().toBlob((blob) => {
            resolve(blob);
          })
        })
      }
  
      const formData = new FormData();
      formData.append("user[comment]", commentElement.value)
      formData.append("user[image]", blob);

      const response = await fetch(`/entry/${currentUserId}`, { 
        method: 'PATCH',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: formData
      })
      const html = await response.text()

      // load a new html without redirection. the file name is 'map'
      document.documentElement.innerHTML = html
      // they are variables while online
      notificationElement = document.getElementById('popup__javascript')
      matchInfoElement = document.getElementById('match-info')
      agreementElement = document.getElementById('agreement')
      appointmentElement = document.getElementById('appointment')
      warningElement = document.getElementById('warning')
      soundElement = document.getElementById('sound')
      loadingScreen = document.getElementById('loading-screen')
      loadingScreen2 = document.getElementById('loading-screen2')
      ackYokohama = document.getElementById('ack-yokohama')

      // edit page is not needed and must not drag a footer 
      document.querySelector('.profile__icon').style.display = 'none'
      document.querySelector('footer').style.pointerEvents = 'none'

      // get back to current location
      document.getElementById('current-location').addEventListener('click', () => {
        map.setCenter({lat: lat, lng: lng})
        map.setZoom(14)
      })

      // sound notification of matching
      audioElement = document.querySelector('audio')
      soundElement.addEventListener('click', () => {
        if(isAllowed) isAllowed = false
        else {
          audioElement.play()
          isAllowed = true
        }
        audioElement.pause()
        audioElement.load()
        soundElement.classList.toggle('sound__on')
      })

      // it is important to point another connect-link(they are different elements)
      connectText = document.getElementById('connect-text')
      connectLink = document.getElementById('connect-link')
      connectText.textContent = 'オフ'  
      connectLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = '/'
      })

      // confirmation before reload or browser-back
      // but message don't make sence
      window.addEventListener('beforeunload', alertBeforeUnload)

      //this is for create a nearby bot
      document.getElementById('bot-creater').addEventListener('click', () => {
        console.log(currentUserId)
        fetch(`/matches/bot`, { 
          method: 'POST',
          headers: {
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({id: currentUserId, latitude: lat, longitude: lng})
        })
      })
    }

    // https://developers.google.cn/maps/documentation/android-sdk/advanced-markers/add-marker?hl=ja
    async function showGoogleMap() {
      (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
      key: "AIzaSyCduQ2F4MLs5vF2I0BKKEqYJmDxA2Yq1QU",
      v: "beta",
      // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
      // Add other bootstrap parameters as needed, using camel case.
      });

      initMap();
      async function initMap() {
        const { Map } = await google.maps.importLibrary('maps')
        const { ColorScheme } = await google.maps.importLibrary("core")
        const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
        MarkerClass = AdvancedMarkerElement

        let pos = { lat: lat, lng: lng};
        map = new Map(document.getElementById('map'), {
          mapId: "3c6f58db644be140",
          center: pos,
          zoom: 14,
          disableDefaultUI: true,
          clickableIcons: false,
          colorScheme: ColorScheme.DARK
        })
        
        myLocation = new MarkerClass({
          map,
          position: pos,
          content: document.querySelector(".icon")
        })

        const yokohamaStationTriangle = new google.maps.Polygon({
          paths: [nishiyokohama, mitsuzawa, shijou],
          strokeColor: "#0acffe",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#0acffe",
          fillOpacity: 0.35,
        })

        yokohamaStationTriangle.setMap(map);
      }
    }
      
    function subscribePublic() {
      subscription = consumer.subscriptions.create("PublicChannel",  {
        initialized() {
          console.log("パブリック通信開始")
        },
        rejected(){
          console.log('public rejected')
          window.removeEventListener('beforeunload', alertBeforeUnload)
          window.location.href = '/exit'
        },
        received(data) {
          // a lot of offers come repeatedly
          console.log(data)
          if(data['user']) {
            // a loop attribute is contained of the audio tag in the html
            if(isAllowed) audioElement.play()

            // insert a set of data
            document.getElementById('name').textContent = data.user.name
            document.getElementById('age').textContent = data.age
            document.getElementById('distance').textContent = `${data.distance}km`
            document.getElementById('comment').textContent = data.user.comment
            matchInfoElement.style.backgroundImage = `url(${data.image})`

            // display a set of data
            matchInfoElement.style.display = 'block'
            connectLink.style.display = 'none'

            // apply for the match
            agreementElement.addEventListener('click', () => {
              subscription.send({like_id: currentUserId, liked_id: data.user.id})
              document.getElementById('loading-screen2').style.display = 'block'
            })

            document.getElementById('map__closeButton').addEventListener('click', () => {
              removeInfo();
            })

            // start animation that shows limited times
            agreementElement.classList.add('animate')
            
            removeInfoWithDelay();
            async function removeInfoWithDelay() {
              await delay(45000)
              removeInfo()
            }

          } else if(data['partnerIcon']) {
            // matched!!
            removeInfo();
            subscription.unsubscribe();
            subscription = null;
            subscribePrivate(data);

          } else if(data === 0) {
            // failed..
            removeInfo();
            alert('相手からもいいねが来ましたが、エラーによりマッチングできませんでした。ごめんなさい。。')
          }
        }
      })
    }

    function subscribePrivate(data) {
      privateSubscription = consumer.subscriptions.create('PrivateChannel', {
        initialized() {
          // appointment is a hash that contains a lot of information
          const appointmentData = data['appointment']
          
          // display station as the center
          map.setCenter(appointmentData['stationLocation'])
          map.setZoom(12)

          // insert a set of data
          connectText.textContent = '解除'
          document.getElementById('station').textContent = `${appointmentData['station_name']}駅 ${appointmentData['point']}`
          document.getElementById('distance-to-station').textContent = `${appointmentData['distance']}km`

          // display or not
          appointmentElement.style.display = 'block'
          warningElement.style.display = 'block'
          loadingScreen.style.display = 'none'
          loadingScreen2.style.display = 'none'
          soundElement.style.display = 'none'

          // time-icon on the station
          let timeIcon = document.createElement('div')
          timeIcon.className = 'meeting-time'
          timeIcon.textContent = appointmentData['meeting_time']
          stationLocation = new MarkerClass({
            map,
            position: appointmentData['stationLocation'],
            content: timeIcon
          })

          // partner-icon
          let partnerIcon = document.createElement('img')
          partnerIcon.alt = "partner-icon"
          partnerIcon.classList.add("icon")
          partnerIcon.src = data['partnerIcon']
          partnerLocation = new MarkerClass({
            map,
            position: data['partnerLocation'],
            content: partnerIcon,
            gmpClickable: true
          })

          // thanks to a beta version, you can click the partner icon
          partnerLocation.addEventListener('gmp-click', (event) => { 
            event.preventDefault();
            matchInfoElement.style.display = 'block'
            agreementElement.style.display = 'none'
          })

          // send a standard type of unmatch signals
          // but shoudn't use an unload event. i should find another way 
          let type = 0
          window.addEventListener('unload', () => {
            privateSubscription.send({type: type})
          })
        },
        rejected() {
          // if you leave from a browser app, you will be rejected when reconnecting
          console.log('private rejected')
          window.removeEventListener('beforeunload', alertBeforeUnload)
          window.location.href = '/exit'
        },
        received(partnerData) {
          if(partnerData === 0) {
            backToThePublic('相手がマッチを解除しました')
          }
          if(partnerData === 1) {
            backToThePublic('相手の接続が切れました')
          }

          function backToThePublic(content = '') {
            zeroNotification()
            async function zeroNotification() {
              notificationElement.textContent = content
              await delay(30000)
              notificationElement.textContent = ''
            }

            appointmentElement.style.display = 'none'
            warningElement.style.display = 'none'
            connectText.textContent = 'オフ'
            loadingScreen.style.display = 'block'
            agreementElement.style.display = 'block'
            soundElement.style.display = 'block'
            partnerLocation.setMap(null);
            stationLocation.setMap(null);
            privateSubscription.unsubscribe()
            privateSubscription = null
            locationSubscription.send({id: currentUserId, latitude: locationData.latitude, longitude: locationData.longitude})
            subscribePublic();
          }
        } 
      })
    }
  }
});
