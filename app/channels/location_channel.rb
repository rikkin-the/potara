class LocationChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def receive(data)
    user = User.find(data["id"])
    lat = data["latitude"]
    lng = data["longitude"]
    array_for_save = ["lat", lat, "lng", lng]

    if $redis_matched.exists?(user.id)
      $redis_matched.hset(user.id, array_for_save)
      partner_id = $redis_matched.hget(user.id, "partner")
      partner = User.find(partner_id)
      p partner
      LocationChannel.broadcast_to(partner, 1)
    else
      if user.girl
        $redis.hmset("girl_#{user.id}", array_for_save)
      else
        $redis.hmset("boy_#{user.id}", array_for_save)
      end
    end
  end
end
