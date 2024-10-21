require 'http'

retries = 3
begin
  response = HTTP.get('https://express.heartrails.com/api/json',
    :params => {:method => "getStations", :x => 139.7004029, :y => 35.6592798})
  station = JSON.parse(response)
  name = station["response"]["station"][0]["name"]

  response = HTTP.get('https://api.ekispert.jp/v1/json/station/light',
    :params => {:key => 'LE_ZfYPzMTzfgvzn', :name => name})
  light_info = JSON.parse(response)

  code = light_info["ResultSet"]["Point"]["Station"]["code"].to_i

  response = HTTP.get('https://api.ekispert.jp/v1/json/station/info',
    :params => {:key => 'LE_ZfYPzMTzfgvzn', :code => code, :type => "exit"})
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
end

p point
