class PublicChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
    puts "Public channel succeed"
  end

  def unsubscribed
    $redis_past.del(current_user.id)
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
      if like_user.girl
        girl = like_user
        boy = liked_user
        girl_key = "girl_#{like_id}"
        boy_key = "boy_#{liked_id}"
        girl_id = like_id
        boy_id = liked_id
      else
        girl = liked_user
        boy = like_user
        girl_key = "girl_#{liked_id}"
        boy_key = "boy_#{liked_id}"
        girl_id = liked_id
        boy_id = like_id
      end
      girl_lat = $redis.hget(girl_key, "lat")
      girl_lng = $redis.hget(girl_key, "lng")
      boy_lat = $redis.hget(boy_key, "lat")
      boy_lng = $redis.hget(boy_key, "lng")
      $redis_matched.hmset(girl_id, ["lat", girl_lat, "lng", girl_lng, "partner", boy_id])
      $redis_matched.hmset(boy_id, ["lat", boy_lat, "lng", boy_lng, "partner", girl_id])
      PublicChannel.broadcast_to(girl, {roomId: girl_id, partnerLocation: {lat: boy_lat.to_f, lng: boy_lng.to_f}})
      PublicChannel.broadcast_to(boy, {roomId: girl_id, partnerLocation: {lat: girl_lat.to_f, lng: girl_lng.to_f}})
      $redis_agreement.del(liked_id)
    else
      $redis_agreement.set(like_id, liked_id)
    end
  end
end
