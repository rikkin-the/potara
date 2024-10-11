class PrivateChannel < ApplicationCable::Channel
  def subscribed
    stream_from "chat_#{params[:first_like_id]}"
    puts "Private channel succeed"
=begin
    partner_id = $redis_agreement.get(current_user.id).to_i
    p partner_id
    partner_user = User.find_by(id: partner_id)
    partner_url = Rails.application.routes.url_helpers.rails_blob_url(partner_user.image, host: "localhost:3000")
    ActionCable.server.broadcast("chat_#{params[:first_like_id]}", partner_url)
=end
  end


  def unsubscribed
    puts "Private channel finished"
  end

  def receive(data)
    ActionCable.server.broadcast("chat_#{params[:first_like_id]}", data)
  end
end
