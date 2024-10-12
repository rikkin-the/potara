$redis = Redis.new(
  url: 'redis://localhost:6379/2'
)

$redis_agreement = Redis.new(
  url: "redis://localhost:6379/3"
)

$redis_matched =  Redis.new(
  url: "redis://localhost:6379/4"
)
