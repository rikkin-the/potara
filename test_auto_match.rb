require 'http'

def get_st(lat, lng)
  response = HTTP.get('https://api.ekispert.jp/v1/json/geo/station',
    params: {key: 'LE_ZfYPzMTzfgvzn', geoPoint: "#{lat},#{lng}", type: "train",
             addGateGroup: "true", excludeSameLineStation: "true", stationCount: 1, })
  light_info = JSON.parse(response)
  station_name = light_info["ResultSet"]["Point"]["Station"]["Name"]
  gate_groups = light_info["ResultSet"]["Point"]["Station"]["GateGroup"]

  point = []
  gate = {}
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
  point = [gate["Name"], gate["GeoPoint"]["lati_d"].to_f, gate["GeoPoint"]["longi_d"].to_f]
end

get_st(35.51415014788513, 139.53964386145861)
