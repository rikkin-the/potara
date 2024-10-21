class PublicChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
    if $redis_matched.exists?(current_user.id)
      $redis_matched.del(current_user.id)
    end
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

      retries = 3
      girl_lat = nil
      boy_lat = nil
      loop{
        girl_lat = $redis.hget(girl_key, "lat")
        boy_lat = $redis.hget(boy_key, "lat")
        break if girl_lat && boy_lat

        retries -= 1
        if retries == 0
          PublicChannel.broadcast_to(girl, 0)
          PublicChannel.broadcast_to(boy, 0)
          exit
        end
        sleep(10)
        p girl_lat
      }
      girl_lng = $redis.hget(girl_key, "lng")
      boy_lng = $redis.hget(boy_key, "lng")
      $redis_matched.hmset(girl_id, ["lat", girl_lat, "lng", girl_lng, "partner", boy_id])
      $redis_matched.hmset(boy_id, ["lat", boy_lat, "lng", boy_lng, "partner", girl_id])

      girl_lat = girl_lat.to_f
      girl_lng = girl_lng.to_f
      boy_lat = boy_lat.to_f
      boy_lng = boy_lng.to_f
      center_lat = (girl_lat + boy_lat)/2
      center_lng = (girl_lng + boy_lng)/2

      retries = 3
      begin
        response = HTTP.get('https://express.heartrails.com/api/json',
          :params => {:method => "getStations", :x => center_lng, :y => center_lat})
        station = JSON.parse(response)
        name = station["response"]["station"][0]["name"]

        response = HTTP.get('https://api.ekispert.jp/v1/json/station/light',
          :params => {:key => ENV['EKISPERT_KEY'], :name => name})
        light_info = JSON.parse(response)
        code = light_info["ResultSet"]["Point"]["Station"]["code"].to_i

        response = HTTP.get('https://api.ekispert.jp/v1/json/station/info',
          :params => {:key => ENV['EKISPERT_KEY'], :code => code, :type => "exit"})
        exit_info = JSON.parse(response)
      rescue => e
        retries -= 1
        if retries > 0
          sleep(3)
          retry
        else
          Rails.logger.error("HTTPリクエストが失敗しました")
          PublicChannel.broadcast_to(girl, 0)
          PublicChannel.broadcast_to(boy, 0)
        end
      else
        station_lat = station["response"]["station"][0]["y"].to_f
        station_lng = station["response"]["station"][0]["x"].to_f
        point = "改札前"
        if exit_arr = exit_info["ResultSet"]["Information"]["Exit"]
          exit_center = exit_arr.filter { |e| e["Name"].include?("中央") }
          if exit_center.any?
            point = exit_center.sample["Name"]
          else
            exit_direction = exit_arr.filter do |e|
              e["Name"].include?("西口") || e["Name"].include?("東口") ||
              e["Name"].include?("南口") || e["Name"].include?("北口")
            end
            if exit_direction.any?
              point = exit_direction.sample["Name"]
            else
              point = exit_info["ResultSet"]["Information"]["Exit"].sample["Name"]
            end
          end
        end
        girl_distance_on_road = 1.3*distance_to_km(distance(girl_lat, girl_lng, station_lat, station_lng))
        boy_distance_on_road = 1.3*distance_to_km(distance(boy_lat, boy_lng, station_lat, station_lng))
        max_distance_on_road = boy_distance_on_road > girl_distance_on_road ?
                              boy_distance_on_road : girl_distance_on_road
        required_time = max_distance_on_road / 0.08
        meeting_time = Time.current.since(required_time.minute) + 15.minute
        time_params = meeting_time.strftime("%H:%M")

        PublicChannel.broadcast_to(girl, {roomId: girl_id, partnerLocation: {lat: boy_lat.to_f, lng: boy_lng.to_f},
          appointment: {station_name: name, station_lat: station_lat, station_lng: station_lng, point: point, distance: girl_distance_on_road,
          meeting_time: time_params}})
        PublicChannel.broadcast_to(boy, {roomId: girl_id, partnerLocation: {lat: girl_lat.to_f, lng: girl_lng.to_f},
          appointment: {station_name: name, station_lat: station_lat, station_lng: station_lng, point: point, distance: boy_distance_on_road,
          meeting_time: time_params}})

        $redis_agreement.del(liked_id)
      end

    else
      $redis_agreement.set(like_id, liked_id)
    end
  end
end
