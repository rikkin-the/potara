class PrivateChannel < ApplicationCable::Channel
  def subscribed
    stream_from "chat_#{params[:first_like_id]}"
    puts "Private channel succeed"
  end

  def unsubscribed
    ActionCable.server.broadcast("chat_#{params[:first_like_id]}", 0)
    $redis_matched.del(current_user.id)
  end

  def receive(data)
    ActionCable.server.broadcast("chat_#{params[:first_like_id]}", data)
  end
end
