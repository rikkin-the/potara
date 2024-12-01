class PrivateChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
  end

  def unsubscribed
  end

  def receive(data)
    if data["type"].to_i == 0
      partner_id = $redis_matched.hget(current_user.id, "partner")
      partner = User.find(partner_id)
      PrivateChannel.broadcast_to(partner, 0)
      $redis_matched.del(current_user.id)
      $redis_matched.del(partner_id)
    end
  end
end
