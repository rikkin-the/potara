
response = HTTP.get('https://express.heartrails.com/api/json', :params => {:method => "getStations", :x => 139.510035, :y => 35.4908585})
hash = response.parse
p hash["response"]["station"][0]
