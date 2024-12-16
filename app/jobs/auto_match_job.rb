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

    girls = []
    boys = []
    cursor = "0"
    begin
      cursor, keys = $redis.scan(cursor)
      keys.each do |key|
        id = key.delete('^0-9').to_i
        location = $redis.hmget(key, "lat", "lng")
        if key.include?("girl")
          girls.push([id, location[0].to_f, location[1].to_f])
        else
          boys.push([id, location[0].to_f, location[1].to_f])
        end
      end
    end until cursor == "0"

    past_pairs = {}
    begin
      cursor, keys = $redis_past.scan(cursor)
      keys.each do |key|
        id = key.to_i
        past_pairs[id] = []
        $redis_past.lrange(id, 0, -1).each do |string_id|
          past_pairs[id].push(string_id.to_i)
        end
      end
    end until cursor == "0"

    pairs = []
    if boys && girls
      girls.each do |girl|
        boys.each do |boy|
          pairs.push([girl[0], boy[0], distance(girl[1], girl[2], boy[1], boy[2])])
        end
      end
      pairs.sort_by! { |pair| pair[2] }
      paired_girls = []
      paired_boys = []
      puts "-------------マッチされたユーザ一覧-------------"
      pairs.each do |pair|
        if !paired_girls.include?(pair[0]) && !paired_boys.include?(pair[1]) && (!past_pairs[pair[0]] || !past_pairs[pair[0]].include?(pair[1])) && (!past_pairs[pair[1]] || !past_pairs[pair[1]].include?(pair[0]))
          p pair
          girl_instance = User.find(pair[0])
          boy_instance = User.find(pair[1])
          girl_instance.get_age
          boy_instance.get_age
          girl_url = Rails.application.routes.url_helpers.rails_blob_path(girl_instance.image.variant(:display), only_path: true)
          boy_url = Rails.application.routes.url_helpers.rails_blob_path(boy_instance.image.variant(:display), only_path: true)
          PublicChannel.broadcast_to(girl_instance, {
            id: boy_instance.id, name: boy_instance.name, comment: boy_instance.comment ,age: boy_instance.age, height: boy_instance.height, distance: distance_to_km(pair[2]), image: boy_url
          })
          PublicChannel.broadcast_to(boy_instance, {
            id: girl_instance.id, name: girl_instance.name, comment: girl_instance.comment , age: girl_instance.age, height: girl_instance.height, distance: distance_to_km(pair[2]), image: girl_url
          })
          paired_girls.push(pair[0])
          paired_boys.push(pair[1])
          $redis_past.rpush(pair[0], pair[1])
          $redis_past.rpush(pair[1], pair[0])
        end
      end
    end
  end
end
=begin
      #girls.each { |girl| $redis.hdel(girl, "paired") }
      #ordered_boys = boys.reverse
      ordered_boys.each do |boy|
        nearest_girl = nil
        shortest_distance = 0.1

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
=end
