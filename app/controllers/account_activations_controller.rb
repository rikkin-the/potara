class AccountActivationsController < ApplicationController

  def edit
    user = User.find_by(email: params[:email])
    if user && !user.activated? && user.authenticated?(:activation, params[:id])
      user.update_attribute(:activated, true)
      user.update_attribute(:activated_at, Time.zone.now)
      reset_session
      remember user
      log_in user
      flash[:sucess] = "アカウントが認証されました！"
      redirect_to root_url
    else
      flash[:danger] = "このリンクは無効です"
      redirect_to root_url
    end
  end

end
