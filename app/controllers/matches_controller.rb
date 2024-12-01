class MatchesController < ApplicationController
  def new
  end

  def await
    user = User.find(params[:id])
    user.update_attribute(:comment, user_params[:comment])
    if user.image.attach(user_params[:image])
      render 'map'
    else
      flash[:danger] = "ユーザー情報の更新に失敗しました。"
      render 'new', status: :unprocessable_entity
    end

  end

  private

    def user_params
      params.require(:user).permit(:comment, :image)
    end
end
