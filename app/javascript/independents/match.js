import consumer from "consumer";
import Cropper from "cropperjs";

const currentUserId = document.getElementById('current_user_id').value
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

function removeInfo() {
  console.log('timeover')
  const matchInfoElement = document.getElementById('match-info')
  matchInfoElement.style.display = 'none'
  document.getElementById('connect-link').style.display = 'block'
  document.getElementById('loading-screen2').style.display = 'none'
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}



connection();
console.log("This is match.js")
function connection() {
  let cropper;
  const commentElement = document.getElementById('user_comment')
  let connectLink = document.getElementById('connect-link')

  cropImage();
  function cropImage() {
    const fileInputElement = document.querySelector('input[type="file"]');
    const previewElement = document.getElementById('image-preview');

    fileInputElement.addEventListener('change', (event) => {
      const addELement = document.querySelector('.add__icon')
      const file = event.target.files[0];
      const reader = new FileReader();

      addELement.style.zIndex = '-10'
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
  }

  connectLink.addEventListener('click', (event) => {
    event.preventDefault();

    if (!cropper) {
      alert("写真が必要です")
    } else if( commentElement.value.length > 63 ) {
      alert("ひとことは63文字以内です")
    } else {
      subscribePublic();
      subscribeLocation();
    }

    function subscribePublic() {
      subscription = consumer.subscriptions.create("PublicChannel",  {
        initialized() {
          console.log("パブリック通信開始")
        },
        received(data) {
          console.log(data)
          if(data['user']) {
            displayMatchInfo(data);
            removeInfoWithDelay();

            function displayMatchInfo(data) {
              let matchInfoElement = document.getElementById('match-info')
              let nameElement = document.getElementById('name') 
              let ageElement = document.getElementById('age')
              let distanceElement = document.getElementById('distance')
              let commentElement = document.getElementById('comment')
              let agreementElement = document.getElementById('agreement')
              const closeButton = document.getElementById('map__closeButton')

              nameElement.textContent = data.user.name
              ageElement.textContent = data.age
              distanceElement.textContent = `${data.distance}km`
              commentElement.textContent = data.user.comment
              matchInfoElement.style.backgroundImage = `url(${data.image})`
              matchInfoElement.style.display = 'block'
              connectLink.style.display = 'none'
              agreementElement.addEventListener('click', () => {
                let agreement_params = { like_id: currentUserId, liked_id: data.user.id }
                subscription.send(agreement_params)
                document.getElementById('loading-screen2').style.display = 'block'
              })
              closeButton.addEventListener('click', () => {
                removeInfo();
              })
              agreementElement.classList.add('animate')
            }

            async function removeInfoWithDelay() {
              await delay(45000)
              removeInfo()
            }

          } else if(data['roomId']) {
            removeInfo();
            if(subscription) {
              subscription.unsubscribe();
              subscription = null;
            }
            if(!privateSubscription) {
              subscribePrivate(data);
            }
          } else if(data === 0) {
            removeInfo();
            alert('相手からもいいねが来ましたが、エラーによりマッチングできませんでした。ごめんなさい。。')
          }
        }
      })
    }

    function subscribePrivate(data) {
      privateSubscription = consumer.subscriptions.create({channel: 'PrivateChannel', girl_id: data['roomId']}, {
        initialized() {
          const appointmentElement = document.getElementById('appointment')
          const stationElement = document.getElementById('station')
          const distanceToStationElement = document.getElementById('distance-to-station')
          //const timeElement = document.getElementById('meeting-time')
          const warningElement = document.getElementById('warning')
          const appointmentData = data['appointment']
          const connectText = document.getElementById('connect-text')
          let partnerIcon = document.createElement('img')
          let timeIcon = document.createElement('div')

          partnerIcon.alt = "partner-icon"
          partnerIcon.classList.add("icon")
          partnerIcon.src = data['partnerIcon']
          timeIcon.className = 'meeting-time'
          timeIcon.textContent = appointmentData['meeting_time']
          
          map.setCenter(appointmentData['stationLocation'])
          map.setZoom(12)
          connectText.textContent = '解除'
          stationElement.textContent = `${appointmentData['station_name']}駅 ${appointmentData['point']}`
          distanceToStationElement.textContent = `${appointmentData['distance']}km`
          //timeElement.textContent = appointmentData['meeting_time']
          appointmentElement.style.display = 'block'
          warningElement.style.display = 'block'
          document.getElementById('loading-screen').style.display = 'none'
          document.getElementById('loading-screen2').style.display = 'none'

          partnerLocation = new MarkerClass({
            map,
            position: data['partnerLocation'],
            content: partnerIcon,
            gmpClickable: true
          })
          
          stationLocation = new MarkerClass({
            map,
            position: appointmentData['stationLocation'],
            content: timeIcon
          })

          partnerLocation.addEventListener('gmp-click', (event) => { 
            event.preventDefault();
            const matchInfoElement = document.getElementById('match-info')
            const agreementElement = document.getElementById('agreement')

            matchInfoElement.style.display = 'block'
            agreementElement.style.display = 'none'
          })

          connectLink.addEventListener('click', (event) => {
            event.preventDefault()
            privateSubscription.unsubscribe()
            privateSubscription = null;
            locationSubscription.unsubscribe()
            locationSubscription = null;
            consumer.connection.close()
            navigator.geolocation.clearWatch(watchId)

            exitToEntry();
            async function exitToEntry() {
              var response =  await fetch('/exit', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({id: currentUserId})
              })
              var data = await response.json()
              window.location.href = data.redirect_url
            }
          })
        }, 
        received(partnerData) {
          if(partnerData === 0) {
            const appointmentElement = document.getElementById('appointment')
            const warningElement = document.getElementById('warning')

            appointmentElement.style.display = 'none'
            warningElement.style.display = 'none'
            document.getElementById('connect-text').textContent = 'オフ'
            document.getElementById('loading-screen').style.display = 'block'
            document.getElementById('agreement').style.display = 'block'
            partnerLocation.setMap(null);
            stationLocation.setMap(null);
            privateSubscription.unsubscribe()
            privateSubscription = null
          
            removeNotification()
            async function removeNotification() {
              const notificationElement = document.getElementById('popup__javascript')
              notificationElement.textContent = '相手がマッチを解除しました'
              await delay(15000)
              notificationElement.textContent = ''
            }

            subscribePublic();
          }
        } 
      })
    }

    async function subscribeLocation() {
      locationSubscription = consumer.subscriptions.create('LocationChannel', {
        initialized() {
          executeInTurn();
        },
        
        received(data) {
          console.log(data)
          const notificationElement = document.getElementById('popup__javascript')
                    
          notificationElement.textContent = '相手が移動しています!'
          async function removeNotification() {
            await delay(5000)
            notificationElement.textContent = ''
          }
          removeNotification()
        }
      })

      async function executeInTurn() {
        await watchCurrent();
        await updateDatabase();
        showGoogleMap();
        prepareDisconnection();
        locationSubscription.send({id: currentUserId, latitude: latitude, longitude: longitude})
      }

      async function watchCurrent() {
        return new Promise(function(resolve, reject) {
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              let data = position.coords;

              if(myLocation) {
                myLocation.position = {lat: latitude, lng: longitude}
              } 

              if(Math.abs(latitude - data.latitude) > 0.0005 ||
                 Math.abs(longitude - data.longitude) > 0.0005 || 
                 !latitude) {
                latitude = data.latitude
                longitude = data.longitude
                let patch_data = { 
                  id: currentUserId, 
                  latitude: latitude,
                  longitude: longitude
                } 
                locationSubscription.send(patch_data)
                console.log('updated location')
              }
              resolve();
            },
            (error) => {
              const errorInfo = [
                "原因不明のエラーが発生しました…。" ,
                "位置情報の取得が許可されませんでした…。" ,
                "電波状況などで位置情報が取得できませんでした…。" ,
                "位置情報の取得に時間がかかり過ぎてタイムアウトしました…。"
              ] ;
      
              let errorMessage = errorInfo[error.code];
              console.log(errorMessage)
              reject()
            },
            {
              "enableHighAccuracy": true
            } 
          );  
        })
      }   

      async function updateDatabase() {
        const formData = new FormData();
        const comment = commentElement.value
        const blob = await getBlobFromCanvas(cropper)
        function getBlobFromCanvas(c) {
          return new Promise((resolve) => {
            c.getCroppedCanvas().toBlob((blob) => {
              resolve(blob);
            })
          })
        }

        formData.append("user[comment]", comment)
        formData.append("user[image]", blob);

        let response = await fetch(`/entry/${currentUserId}`, { 
          method: 'PATCH',
          headers: {
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
          },
          body: formData
        })
        let html = await response.text()
        document.documentElement.innerHTML = html
        connectLink = document.getElementById('connect-link')
        document.getElementById('connect-text').textContent = 'オフ'
        document.querySelector('.profile__icon').style.display = 'none'
        document.querySelector('footer').style.pointerEvents = 'none'
        document.getElementById('current-location').addEventListener('click', () => {
          map.setCenter({lat: latitude, lng: longitude})
          map.setZoom(14)
        })
      }

      async function showGoogleMap() {
        (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
        key: "AIzaSyCduQ2F4MLs5vF2I0BKKEqYJmDxA2Yq1QU",
        v: "beta",
        // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
        // Add other bootstrap parameters as needed, using camel case.
        });

        initMap();
        async function initMap() {
          let pos = { lat: latitude, lng: longitude};
          const myImage = document.querySelector(".icon")
          const { Map } = await google.maps.importLibrary('maps')
          const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
          MarkerClass = AdvancedMarkerElement
          const { ColorScheme } = await google.maps.importLibrary("core")
       

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
            content: myImage
          })
        }
      }

      function prepareDisconnection() {
        connectLink.addEventListener('click', (event) => {
          event.preventDefault();
          subscription.unsubscribe();
          subscription = null;
          locationSubscription.unsubscribe()
          locationSubscription = null
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
    }
  });
} 