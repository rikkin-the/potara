m = []
10.times do |i|
  m[i] = {lat: Random.rand(-100..100), lng: Random.rand(-100..100)}
  puts m[i]
end

f = []
10.times do |i|
  f[i] = {lat: Random.rand(-100..100), lng: Random.rand(-100..100)}
end
