class PrivateChannel < ApplicationCable::Channel

  def subscribed
    stream_for current_user
    reject unless $redis_matched.get(current_user.id)
  end

  def unsubscribed
    partner_id = $redis_matched.get(current_user.id)
    send_to_partner(partner_id, 1)
  end

  def receive(data)
    partner_id = $redis_matched.get(current_user.id)
    send_to_partner(partner_id, 0)
    $redis_matched.del(current_user.id)
    $redis_matched.del(partner_id)
=begin
    type = data["type"].to_i
    if type == 0
      unmatch(type)
    end
=end
  end

  def send_to_partner(partner_id, type)
    partner = User.find(partner_id)
    PrivateChannel.broadcast_to(partner, type)
  end
end
