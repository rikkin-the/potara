class AutoMatchJob < ApplicationJob
  queue_as :match

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
          p "マッチされました"
          girl_instance = User.find(pair[0])
          boy_instance = User.find(pair[1])
          girl_instance.get_age
          boy_instance.get_age
          girl_url = Rails.application.routes.url_helpers.rails_blob_path(girl_instance.image, only_path: true)
          boy_url = Rails.application.routes.url_helpers.rails_blob_path(boy_instance.image, only_path: true)
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
