class MatchesController < ApplicationController
  def new
    if logged_in?
#beta用コメントアウト
=begin
      case params[:flash]
      when 'timeout' then
        flash.now[:danger] = "マッチング時間は終了しました"
      when 'rejected' then
        flash.now[:danger] = "通信が切断されました"
      end

      current_time = Time.current
      @next_hour = current_time.hour + 1
      current_time.min <= 10 ? render('logged_in') : render('out_of_time')
=end
      render 'logged_in'
    else
      render 'not_logged_in'
    end
  end

  def await
    user = User.find(params[:id])
    user.update_attribute(:comment, user_params[:comment])
    user.image.attach(user_params[:image])
    render 'map'
  end

=begin
  def create_bot
    user = User.find(params[:id])
    if user.girl
      $redis.hset("boy_3", "lat", params[:latitude]+0.01, "lng", params[:longitude]+0.01)
    else
      $redis.hset("girl_13", "lat", params[:latitude]+0.01, "lng", params[:longitude]+0.01)
    end
  end
=end

  private

    def user_params
      params.require(:user).permit(:comment, :image)
    end
end
