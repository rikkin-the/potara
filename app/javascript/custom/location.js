function locationWatching() {
  const allowlink = document.getElementById('get-position-btn');

  allowlink.addEventListener('click', (event) => { 
    event.preventDefault();

    if( navigator.geolocation )
      {
        let watchId = navigator.geolocation.watchPosition(
          (position) => {
            let data = position.coords ;
            let latitude = data.latitude;
            let longitude = data.longitude;
            let patch_data = { user: {
              id: currentUserId, 
              latitude: latitude,
              longitude: longitude
            } };
      
            document.getElementById('location-result').innerHTML = `<p>緯度: ${latitude} 経度: ${longitude}</p>`;
            fetch('/update_location', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
              },
              body: JSON.stringify(patch_data)
            })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.log(error));
 
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
      
            document.getElementById("location-result").innerHTML = errorMessage;
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


document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('get-position-btn')) {
    locationWatching();
  }
  
  document.addEventListener('turbo:load', () => {
  if (document.getElementById('get-position-btn')) {
    locationWatching();
  }
})
})


