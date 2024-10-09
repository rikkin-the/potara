$redis = Redis.new(
  url: 'redis://localhost:6379/2'
)

$redis_agreement = Redis.new(
  url: "redis://localhost:6379/3"
)
