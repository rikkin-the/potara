class MatchesController < ApplicationController
  def new
  end

  def await
    user = User.find(params[:id])
    user.update_attribute(:comment, user_params[:comment])
    if user.image.attach(user_params[:image])
      render 'map'
    else
      flash[:danger] = "ユーザー情報の更新に失敗しました"
      render 'new', status: :unprocessable_entity
    end

  end

  def rejected
    flash.now[:danger] = "接続が失われました"
    render 'new'
  end

  def create_bot
    user = User.find(params[:id])
    if user.girl
      $redis.hset("boy_3", "lat", params[:latitude]+0.01, "lng", params[:longitude]+0.01)
    else
      $redis.hset("girl_13", "lat", params[:latitude]+0.01, "lng", params[:longitude]+0.01)
    end
  end

  private

    def user_params
      params.require(:user).permit(:comment, :image)
    end
end
