class PublicChannel < ApplicationCable::Channel
  def subscribed
    stream_from current_user
    puts "接続ルビー"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
