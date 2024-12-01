class PrivateChannel < ApplicationCable::Channel

  def unmatch(type)
    partner_id = $redis_matched.hget(current_user.id, "partner")
    partner = User.find(partner_id)
    PrivateChannel.broadcast_to(partner, type)
    $redis_matched.del(current_user.id)
    $redis_matched.del(partner_id)
  end

  def subscribed
    stream_for current_user
    reject unless $redis_matched.exists?(current_user.id)
  end

  def unsubscribed
    unmatch(1) if $redis_matched.exists?(current_user.id)
  end

  def receive(data)
    type = data["type"].to_i
    if type == 0
      unmatch(type)
    end
  end
end
