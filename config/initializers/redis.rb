$redis = Redis.new(
  url: "#{ENV['REDIS_URL']}/2"
)

$redis_agreement = Redis.new(
  url: "#{ENV['REDIS_URL']}/3"
)

$redis_matched =  Redis.new(
  url: "#{ENV['REDIS_URL']}/4"
)

$redis_past = Redis.new(
  url: "#{ENV['REDIS_URL']}/5"
)
