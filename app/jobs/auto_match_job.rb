class AutoMatchJob < ApplicationJob
  queue_as :default

  def distance(lat1, lng1, lat2, lng2)
      Math.sqrt((lat1 - lat2)*(lat1 - lat2) + (lng1 - lng2)*(lng1 - lng2))
  end

  def distance_to_km(hypotenuse_in_angle)
    100*hypotenuse_in_angle
  end

  def perform
    boys = $redis.keys("boy*")
    girls = $redis.keys("girl*")
    if boys && girls
      boys.each do |boy|
        nearest_girl = nil
        shortest_distance = 10000
        boy_lat = $redis.hget(boy, "lat").to_f
        boy_lng = $redis.hget(boy, "lng").to_f
        girls.each do |girl|
          girl_lat = $redis.hget(girl, "lat").to_f
          girl_lng = $redis.hget(girl, "lng").to_f
          calculation_result = distance(boy_lat, boy_lng, girl_lat, girl_lng)
          if calculation_result < shortest_distance
            shortest_distance = calculation_result
            nearest_girl = girl
          end
        end
        if !nearest_girl.nil?
          girl_instance = User.find_by(id: nearest_girl.delete('^0-9'))
          boy_instance = User.find_by(id: boy.delete('^0-9'))
          girl_instance.get_age
          boy_instance.get_age
          PublicChannel.broadcast_to(girl_instance, {user: boy_instance, age: boy_instance.age, distance: distance_to_km(shortest_distance)})
          PublicChannel.broadcast_to(boy_instance, {user: girl_instance, age: girl_instance.age, distance: distance_to_km(shortest_distance)})
        end
      end
    end
  end
end
