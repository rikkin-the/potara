class PublicChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
    puts "サーバー：接続完了"
  end

  def unsubscribed
    puts "サーバー：接続切断"
  end
end
