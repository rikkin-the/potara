class DisconnectJob < ApplicationJob
  queue_as :disconnect

  def perform(*args)
    $redis.flushdb
    $redis_past.flushdb
    ActionCable.server.broadcast("global_notification", 1)
    shibuya = [35.65843105374949, 139.7004629171449]
    variations = Array.new(2) { Random.rand(-0.01..0.01) }
    $redis.hset("boy_3", "lat", shibuya[0] + variations[0], "lng", shibuya[1] + variations[1] )
    $redis.hset("girl_8", "lat", shibuya[0] + variations[0], "lng", shibuya[1] + variations[1] )
  end
end
