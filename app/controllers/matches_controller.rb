class MatchesController < ApplicationController
  def new
  end

  def update_location
    user = User.find(params[:user][:id])
    if user.update(user_params)
      render json: { statusText: "位置情報が更新されました" }, status: :ok
    else
      render json: { statusText: "位置情報が更新できませんでした" }, status: :unprocessable_entity
    end
  end

  def await
    user = User.find(params[:id])
    user.comment = user_params[:comment]
    user.image.attach(user_params[:image])
    if user.save
      user.update_attribute(:online, true)
      render 'map'
    else
      flash[:danger] = "ユーザー情報の更新に失敗しました。"
      render 'new', status: :unprocessable_entity
    end

  end

  def disconnect
    user = User.find(params[:id])
    offline_status = {comment: nil, image: nil, online: false}
    if user.update(offline_status)
      render json: { redirect_url: entry_path }
    else
      flash[:danger] = "ユーザー情報の更新に失敗しました。"
      render 'map', status: :unprocessable_entity
    end
  end

  private

    def user_params
      params.require(:user).permit(:comment, :image, :latitude, :longitude)
    end
end
