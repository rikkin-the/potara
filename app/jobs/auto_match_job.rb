class AutoMatchJob < ApplicationJob
  queue_as :default

  def perform(girl_user)
    def distance(lat1, lng1, lat2, lng2)
      Math.sqrt((lat1-lat2)*(lat1-lat2) + (lng1-lng2)*(lng1-lng2))
    end

    while girl_user.online do
      girl_lat = girl_user.latitude
      girl_lng = girl_user.longitude
      candidates = User.where("girl = ? AND online = ?
                   AND (ABS(latitude - ?) < ?)
                   AND (ABS(longitude - ?) < ?)",
                   false, true,
                   girl_lat, 0.09,
                   girl_lng, 0.11)
      if candidates.any?
        nearest_boy = candidates.max_by do |candidate|
          distance girl_lat, girl_lng, candidate.latitude, candidate.longitude
        end
        if nearest_boy
          nearest_boy.get_age
          girl_user.get_age
          PublicChannel.broadcast_to(girl_user, {user: nearest_boy, age: nearest_boy.age})
          PublicChannel.broadcast_to(nearest_boy, {user: girl_user, age: girl_user.age})
          break
        end
      end
      sleep(20)
    end
  end
end
