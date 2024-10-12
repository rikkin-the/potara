class MatchesController < ApplicationController
  def new
  end

  def update_location
    user = User.find(params[:user][:id])
    lat = params[:user][:latitude]
    lng = params[:user][:longitude]
    array_for_save = ["lat", lat, "lng", lng]
    if $redis_matched.exists(user.id) == 1
      $redis_matched.hset(user.id, array_for_save)
      partner_id = $redis_matched.hget(user.id, "partner").to_i
      partner_user = User.find(partner_id)
      LocationChannel.broadcast_to(partner_user, {lat: lat, lng: lng})
    else
      if user.girl
        $redis.hmset("girl_#{user.id}", array_for_save)
      else
        $redis.hmset("boy_#{user.id}", array_for_save)
      end
    end
    render json: { statusText: "位置情報が更新されました" }, status: :ok
  end

  def await
    user = User.find(params[:id])
    user.comment = user_params[:comment]
    user.image.attach(user_params[:image])
    if user.save
      render 'map'
    else
      flash[:danger] = "ユーザー情報の更新に失敗しました。"
      render 'new', status: :unprocessable_entity
    end

  end

  def disconnect
    render json: { redirect_url: entry_path }
  end

  private

    def user_params
      params.require(:user).permit(:comment, :image)
    end
end
