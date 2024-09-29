import consumer from "channels/consumer"

let subscription = null;

document.addEventListener('DOMContentLoaded', () => {
  const connectLink = document.getElementById('connect-link');
  const disconnectLink = document.getElementById('disconnect-link');

  connectLink.addEventListener('click', (event) => {
    event.preventDefault();

    if (!subscription) {
      subscription = consumer.subscriptions.create("PublicChannel",  {
        connected() {
          // Called when the subscription is ready for use on the server
          console.log('接続ジャヴァ')
        },

        disconnected() {
          // Called when the subscription has been terminated by the server
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
});

  




