import consumer from "channels/consumer"

let subscription = null;


function realtimeConnection() {
  const connectLink = document.getElementById('connect-link')
  const disconnectLink = document.getElementById('disconnect-link')
  const form = document.getElementById('whole-form');

  connectLink.addEventListener('click', (event) => {
    event.preventDefault();

    if (!subscription) {
      subscription = consumer.subscriptions.create("PublicChannel",  {
        connected() {
          // Called when the subscription is ready for use on the server
          console.log('リアルタイム通信が繋がりました');
          fetch(`/entry/${currentUserId}`, { 
            method: 'PATCH',
            headers: {
              'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: new FormData(form)
          })
          .then(response => response.json())
          .then(data => {
            if (data.redirect_url) {
              window.location.href = data.redirect_url;
            }
          })
          .catch(error => console.log(error));
          
        },

        disconnected() {
          // Called when the subscription has been terminated by the server
          console.log('リアルタイム通信への接続に失敗しました')
        },

        received(data) {
          // Called when there's incoming data on the websocket for this channel
          new Notification(data['title'], { body: data['body'] })
        } 
      });
   } 
  });
    
  disconnectLink.addEventListener('click', (event) => {
    event.preventDefault();

    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('ページがリロードされました')
  realtimeConnection();
})

document.addEventListener('turbo:load', () => {
  console.log('ページが遷移されました')
  realtimeConnection();
})





