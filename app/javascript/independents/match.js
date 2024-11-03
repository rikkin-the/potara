import consumer from "consumer"
import Cropper from "cropperjs";

let latitude;
let longitude;
let subscription;
let watchId;
let privateSubscription;
let locationSubscription;
let map;
let MarkerClass;
let myLocation;
let stationLocation;
let partnerLocation;

function connection() {
  let connectLink = document.getElementById('connect-link')
  let partnerImageElement;
  let cropper;
  const commentElement = document.getElementById('user_comment')
  
  function removeInfo() {
    console.log('timeover')
    const matchInfoElement = document.getElementById('match-info')
    matchInfoElement.style.display = 'none'
    connectLink.style.display = 'block'
    document.getElementById('loading-screen2').style.display = 'none'
    /* let lists = ['name' , 'age',  'distance']
    for ( let i = 0; i < lists.length; i++ ){
      document.getElementById(lists[i]).textContent = null;
    }
    document.getElementById('match-info').removeAttribute('background-image')
    matchInfoElement.style.display = 'none'
    connectLink.style.display = 'block'
    document.getElementById('loading-screen2').style.display = 'none'*/
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

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
  cropImage();

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
        connected() {
          console.log("パブリック通信開始")
        },
        disconnected() {
        },
        received(data) {
          console.log(data)
          if(data['user']) {
            
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
            }

            async function removeInfoWithDelay() {
              await delay(45000)
              removeInfo()
            }

            displayMatchInfo(data);
            removeInfoWithDelay();

          } else if(data['roomId']) {
            if(subscription) {
              subscription.unsubscribe();
              subscription = null;
            }
            if(!privateSubscription) {
              privateSubscription = consumer.subscriptions.create({channel: 'PrivateChannel', girl_id: data['roomId']}, {
                connected() {
                  //const partnerImageElement = document.getElementById('partner-image')
                  const appointmentElement = document.getElementById('appointment')
                  const stationElement = document.getElementById('station')
                  const distanceToStationElement = document.getElementById('distance-to-station')
                  const timeElement = document.getElementById('meeting-time')
                  const warningElement = document.getElementById('warning')
                  const appointmentData = data['appointment']
                  const connectText = document.getElementById('connect-text')
                  
                  removeInfo();

                  map.setCenter(appointmentData['stationLocation'])
                  map.setZoom(12)

                  connectText.textContent = '解除'
                  stationElement.textContent = `${appointmentData['station_name']}駅 ${appointmentData['point']}`
                  distanceToStationElement.textContent = `${appointmentData['distance']}km`
                  timeElement.textContent = appointmentData['meeting_time']
                  partnerImageElement.src = data['partnerImage']
                  partnerImageElement.style.display = 'inline'
                  appointmentElement.style.display = 'block'
                  warningElement.style.display = 'block'
                  document.getElementById('loading-screen').style.display = 'none'
                  document.getElementById('loading-screen2').style.display = 'none'

                  partnerLocation = new MarkerClass({
                    map,
                    position: data['partnerLocation'],
                    content: partnerImageElement
                  })
                  
                  stationLocation = new MarkerClass({
                    map,
                    position: appointmentData['stationLocation']
                  })

                  connectLink.addEventListener('click', (event) => {
                    event.preventDefault()
                    privateSubscription.unsubscribe()
                    privateSubscription = null;
                    locationSubscription.unsubscribe()
                    locationSubscription = null;
                    consumer.connection.close()
                    navigator.geolocation.clearWatch(watchId)

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
                    exitToEntry();

                  })

                  partnerImageElement.addEventListener(('click'), (event) => { 
                    event.preventDefault();
                      const matchInfoElement = document.getElementById('match-info')
                      const agreementElement = document.getElementById('agreement')

                      matchInfoElement.style.display = 'block'
                      agreementElement.style.display = 'none';
                  })
                }, 
                disconnceted() {
                }, 
                received(partnerData) {
                  if(partnerData === 0) {
                    //const partnerImageElement = document.getElementById('partner-image')
                    const appointmentElement = document.getElementById('appointment')
                    const warningElement = document.getElementById('warning')


                    privateSubscription.unsubscribe()
                    //locationSubscription.unsubscribe()
                    privateSubscription = null
                    //locationSubscription = null
                    //chatElement.style.display = 'none'
                    appointmentElement.style.display = 'none'
                    warningElement.style.display = 'none'
                    partnerImageElement.style.display = 'none'
                    document.getElementById('connect-text').textContent = 'オフ'
                    document.getElementById('loading-screen').style.display = 'block'
                    document.getElementById('agreement').style.display = 'block'
                    partnerLocation.setMap(null);
                    stationLocation.setMap(null);
                  
                    async function removeNotification() {
                      const notificationElement = document.getElementById('popup__javascript')
                      notificationElement.textContent = '相手がマッチを解除しました'
                      await delay(15000)
                      notificationElement.textContent = ''
                    }
                    removeNotification()
  
                    subscribePublic();
                  }
                } 
              })
            }
          } else if(data === 0) {
            alert('相手からもいいねが来ましたが、エラーによりマッチングできませんでした。ごめんなさい。。')
          }
        }
      })
    }

    async function subscribeLocation() {
      function watchCurrent() {
        return new Promise(function(resolve, reject) {
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              let data = position.coords 
              latitude = data.latitude
              longitude = data.longitude
              let patch_data = { 
                id: currentUserId, 
                latitude: latitude,
                longitude: longitude
              } 

              if(map && myLocation) {
                myLocation.position = {lat: latitude, lng: longitude}
                console.log('reset location')
              }

              locationSubscription.send(patch_data)
              resolve()
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
        function getBlobFromCanvas(c) {
          return new Promise((resolve) => {
            c.getCroppedCanvas().toBlob((blob) => {
              resolve(blob);
            })
          })
        }

        const formData = new FormData();
        const comment = commentElement.value
        const blob = await getBlobFromCanvas(cropper)
        formData.append("user[comment]", comment)
        formData.append("user[image]", blob);

        var response = await fetch(`/entry/${currentUserId}`, { 
          method: 'PATCH',
          headers: {
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
          },
          body: formData
        })
        var html = await response.text()
        document.documentElement.innerHTML = html
        connectLink = document.getElementById('connect-link')
        document.getElementById('connect-text').textContent = 'オフ'
        document.querySelector('.profile__icon').style.display = 'none'
        partnerImageElement = document.getElementById('partner-image')
        }

      async function showGoogleMap() {
        (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
        key: "AIzaSyCduQ2F4MLs5vF2I0BKKEqYJmDxA2Yq1QU",
        v: "beta",
        // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
        // Add other bootstrap parameters as needed, using camel case.
        });

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
            zoom: 15,
            disableDefaultUI: true,
            colorScheme: ColorScheme.DARK,
            clickableIcons: false,
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

      async function executeInTurn() {
        await watchCurrent();
        await updateDatabase();
        showGoogleMap();
        prepareDisconnection();
      }

      locationSubscription = consumer.subscriptions.create('LocationChannel', {
        connected() {
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
    }
  });
} 

document.addEventListener('turbo:load', () => {
  console.log('JavaScriptを読み込み')
    if (document.querySelector('.matchesNew__Image')) {
      connection();
      console.log('ページ遷移によりWebSocket通信が可能になりました')
    }
})

window.addEventListener('popstate', () => {
    if(subscription){
      consumer.connection.close();
      navigator.geolocation.clearWatch(watchId)
    }
}) 