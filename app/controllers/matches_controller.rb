class MatchesController < ApplicationController
  def new
  end

  def update_location
    user = User.find(params[:user][:id])
    array_for_save = ["lat", params[:user][:latitude], "lng", params[:user][:longitude]]
    if user.girl
      $redis.hmset("girl_#{user.id}", array_for_save)
    else
      $redis.hmset("boy_#{user.id}", array_for_save)
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
