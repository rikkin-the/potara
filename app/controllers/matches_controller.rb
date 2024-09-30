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
    #await for an establishment of websocket
    #if sucessed, go to waiting-page
    #otherwise flash an error because of websocket
    user = User.find(params[:id])
    user.comment = user_params[:comment]
    user.image.attach(user_params[:image])
    if user.save
      redirect_to root_url
    else
      flash[:danger] = "エントリーに失敗しました"
      render 'new', status: :unprocessable_entity
    end

  end

  private

    def user_params
      params.require(:user).permit(:comment, :image, :latitude, :longitude)
    end
end
