module MatchesHelper
  def distance(lat1, lng1, lat2, lng2)
    Math.sqrt((lat1 - lat2)*(lat1 - lat2) + (lng1 - lng2)*(lng1 - lng2))
  end

  def distance_to_m(hypotenuse_in_angle)
    (100000*hypotenuse_in_angle).floor
  end
end
