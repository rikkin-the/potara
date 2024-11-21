class AutoMatchJob < ApplicationJob
  queue_as :default

  def filter(id, keys_array)
    invalid_ids = $redis_past.lrange(id, 0, -1)
    unpaired_keys_array = keys_array.filter { |key| $redis.hget(key, "paired").to_i != 1 }
    girl_ids = unpaired_keys_array.map { |key| key.delete('^0-9') }
    valid_ids = girl_ids - invalid_ids
    valid_name_included_girls = valid_ids.map { |i| "girl_#{i}" }
    return valid_name_included_girls
  end

  def perform
    $redis_agreement.flushdb
    boys = $redis.keys("boy*")
    girls = $redis.keys("girl*")

    if boys && girls
      girls.each { |girl| $redis.hdel(girl, "paired") }
      ordered_boys = boys.reverse
      ordered_boys.each do |boy|
        nearest_girl = nil
        shortest_distance = 0.1
        boy_id = boy.delete('^0-9').to_i
        boy_lat = $redis.hget(boy, "lat").to_f
        boy_lng = $redis.hget(boy, "lng").to_f
        valid_girls = filter(boy_id, girls)
        valid_girls.each do |girl|
          valid_girl_id = girl.delete('^0-9').to_i
          past_boy_ids = $redis_past.lrange(valid_girl_id, 0, -1)
          past_boy_ids = past_boy_ids.map { |i| i.to_i }
          if !past_boy_ids.include?(boy_id)
            girl_lat = $redis.hget(girl, "lat").to_f
            girl_lng = $redis.hget(girl, "lng").to_f
            calculation_result = distance(boy_lat, boy_lng, girl_lat, girl_lng)
            if calculation_result < shortest_distance
              shortest_distance = calculation_result
              nearest_girl = girl
            end
          end
        end
        if !nearest_girl.nil?
          nearest_girl_id = nearest_girl.delete('^0-9').to_i
          girl_instance = User.find(nearest_girl_id)
          boy_instance = User.find(boy_id)
          girl_instance.get_age
          boy_instance.get_age
          girl_url = Rails.application.routes.url_helpers.rails_blob_path(girl_instance.image.variant(:display), only_path: true)
          boy_url = Rails.application.routes.url_helpers.rails_blob_path(boy_instance.image.variant(:display), only_path: true)
          PublicChannel.broadcast_to(girl_instance, {
            user: boy_instance, age: boy_instance.age, distance: distance_to_km(shortest_distance), image: boy_url
          })
          PublicChannel.broadcast_to(boy_instance, {
            user: girl_instance, age: girl_instance.age, distance: distance_to_km(shortest_distance), image: girl_url
          })
          $redis.hset("girl_#{nearest_girl_id}", "paired", 1)
          $redis_past.rpush(boy_id, nearest_girl_id)
          $redis_past.rpush(nearest_girl_id, boy_id)
        end
      end
    end
  end
end
