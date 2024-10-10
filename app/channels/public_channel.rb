class PublicChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
    puts "Public channel succeed"
  end

  def unsubscribed
    if current_user.girl
      $redis.del("girl_#{current_user.id}")
    else
      $redis.del("boy_#{current_user.id}")
    end
    puts "Public channel finished"
  end

  def receive(data)
    like_id = data["like_id"]
    liked_id = data["liked_id"]
    like_user = User.find_by(id: like_id)
    liked_user = User.find_by(id: liked_id)
    if $redis_agreement.get(liked_id) == like_id.to_s
      PublicChannel.broadcast_to(like_user, liked_id)
      PublicChannel.broadcast_to(liked_user, liked_id)
    else
      $redis_agreement.set(like_id, liked_id)
    end
  end
end
