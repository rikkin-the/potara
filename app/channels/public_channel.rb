class PublicChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
    $redis_matched.del(current_user.id) if $redis_matched.exists?(current_user.id)
    reject unless current_user.image.attached?
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
    #const = (3..22).to_a
    like_user = User.find_by(id: data["like_id"])
    liked_user = User.find_by(id: data["liked_id"])
    if $redis_agreement.get(liked_user.id) == like_user.id.to_s
      if like_user.girl
        girl = like_user
        boy = liked_user
      else
        girl = liked_user
        boy = like_user
      end

      girl_loc = $redis.hmget("girl_#{girl.id}", ["lat", "lng"])
      girl_loc.map! { |l| l.to_f }
      boy_loc = $redis.hmget("boy_#{boy.id}", ["lat", "lng"])
      boy_loc.map! { |l| l.to_f }
      locations = {girl: girl_loc, boy: boy_loc}
      locations[:center] = [(locations[:girl][0]+locations[:boy][0])/2.to_f, (locations[:girl][1]+locations[:boy][1])/2.to_f]

      response = HTTP.get('https://api.ekispert.jp/v1/json/geo/station',
        params: {key: ENV['EKISPERT_KEY'], geoPoint: "#{locations[:center][0]},#{locations[:center][1]},wgs84", type: "train",
                addGateGroup: "true", excludeSameLineStation: "true", stationCount: 1, gcs: 'wgs84'})
      info = JSON.parse(response)
      station_name = info["ResultSet"]["Point"]["Station"]["Name"]
      gate_groups = info["ResultSet"]["Point"]["Station"]["GateGroup"]

      gate = {}
      if station_name == "横浜"
        gate = gate_groups[3]["Gate"][0]
      else
        gate_candidates = []
        main_gates = ["中央口", "東口", "西口", "南口", "北口"]
        if gate_groups.class != Array
          gate_groups = [gate_groups]
        end
        gate_groups.each do |gates|
          if gates["Gate"].class != Array
            gates["Gate"] = [gates["Gate"]]
          end
          gates["Gate"].each do |gate|
            if main_gates.include?(gate["Name"])
              gate_candidates.push(gate)
            end
          end
        end
        if gate_candidates.any?
          gate = gate_candidates.sample
        else
          gate = gate_groups.sample["Gate"].sample
        end
      end
      point = [gate["Name"], gate["GeoPoint"]["lati_d"].to_f, gate["GeoPoint"]["longi_d"].to_f]

      puts "指定された駅"
      p point
      distances = {}
      distances[:girl] = 1.3*distance_to_km(distance(locations[:girl][0], locations[:girl][1], point[1], point[2]))
      distances[:boy] = 1.3*distance_to_km(distance(locations[:boy][0], locations[:boy][1], point[1], point[2]))
      distances[:max] = distances[:boy] > distances[:girl] ? distances[:boy] : distances[:girl]
      required_time = distances[:max] / 0.08
      meeting_time = Time.current.since(required_time.minute) + 15.minute
      time_params = meeting_time.strftime("%H:%M")
      girl_icon =  Rails.application.routes.url_helpers.rails_blob_path(girl.image.variant(:icon), only_path: true)
      boy_icon =  Rails.application.routes.url_helpers.rails_blob_path(boy.image.variant(:icon), only_path: true)
      #variations = Array.new(2) { Random.rand(-0.005..0.005) }

      PublicChannel.broadcast_to(girl, {partnerIcon: boy_icon, partnerLocation: {lat: locations[:boy][0], lng: locations[:boy][1]},
        appointment: {station_name: station_name, stationLocation: {lat: point[1], lng: point[2]}, point: point[0], distance: distances[:girl].floor(1),
        meeting_time: time_params}})
      PublicChannel.broadcast_to(boy, {partnerIcon: girl_icon, partnerLocation: {lat: locations[:girl][0], lng: locations[:girl][1]},
        appointment: {station_name: station_name, stationLocation: {lat: point[1], lng: point[2]}, point: point[0], distance: distances[:boy].floor(1),
        meeting_time: time_params}})

      $redis_matched.hmset(girl.id, ["lat", locations[:girl][0], "lng", locations[:girl][1], "partner", boy.id])
      $redis_matched.hmset(boy.id, ["lat", locations[:boy][0], "lng", locations[:boy][1], "partner", girl.id])
      $redis_agreement.del(liked_user.id)
    else
      $redis_agreement.set(like_user.id, liked_user.id)
    end
  end
end
