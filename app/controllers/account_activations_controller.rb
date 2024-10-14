class AccountActivationsController < ApplicationController

  def edit
    user = User.find_by(email: params[:email])
    if user && !user.activated? && user.authenticated?(:activation, params[:id])
      user.update_attibute(:activated, true)
      user.update_attibute(:activated_at, Time.zone.now)
      reset_session
      log_in user
      remember user
      flash[:sucess] = "アカウントが認証されました！"
      redirect_to root_url
    else
      flash[:danger] = "このリンクは無効です"
      redirect_to root_url
    end
  end

end
