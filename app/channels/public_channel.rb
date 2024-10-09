class PublicChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
    puts "サーバー：接続完了"
  end

  def unsubscribed
    puts "サーバー：接続切断"
  end

  def receive(data)
    like = data.like
    liked = data.liked
    if $redis_agreement.get(liked, like)
      #ActionCable.server.broadcast ここから。Channel数は2つか。3つか。javascriptでデータの個数を判別してもらってもいいかも
      #ActionCable.server.broadcast
    else
      $redis_agreement.set(like, liked)
    end
  end
end
