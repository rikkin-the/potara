class PrivateChannel < ApplicationCable::Channel
  def subscribed
    stream_from "matched_#{params[:girl_id]}"
  end

  def unsubscribed
    ActionCable.server.broadcast("matched_#{params[:girl_id]}", 0)
    $redis_matched.del(current_user.id)
  end

  def receive(data)
  end
end
