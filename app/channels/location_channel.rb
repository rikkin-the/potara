class LocationChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def receive(data)
    partner_id = $redis_matched.get(data["id"])
    if partner_id.nil?
      user = User.find(data["id"])
      if user.girl
        $redis.hmset("girl_#{user.id}", ["lat", data["latitude"], "lng", data["longitude"]])
      else
        $redis.hmset("boy_#{user.id}", ["lat", data["latitude"], "lng", data["longitude"]])
      end
    else
      partner = User.find(partner_id)
      LocationChannel.broadcast_to(partner, {lat: data["latitude"], lng: data["longitude"]})
    end
  end
end
