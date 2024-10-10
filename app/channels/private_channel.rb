class PrivateChannel < ApplicationCable::Channel
  def subscribed
    stream_from "chat_#{params[:first_like_id]}"
    puts "Private channel succeed"
  end

  def unsubscribed
    puts "Private channel finished"
  end

  def receive(data)
    ActionCable.server.broadcast("chat_#{params[:first_like_id]}", data)
  end
end
