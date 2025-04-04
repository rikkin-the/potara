class SessionsController < ApplicationController
  def new
  end

  def create
    user = User.find_by(email: params[:session][:email].downcase)
    if user&.authenticate(params[:session][:password])
      if user.activated?
        reset_session
        remember user
        log_in user
        redirect_to root_url
      else
        message = "アカウントが認証されていません"
        message += "登録のメールアドレスから認証リンクを探してください"
        flash[:warning] = message
        redirect_to root_url
      end
    else
      if user.girl == nil
        flash[:success] = "プロフィールが未記入です。登録を完了させましょう。"
        redirect_to "/signup/#{user.id}"
      else
        flash.now[:danger] = 'メールアドレスまたはパスワードが間違っています'
        render 'new', status: :unprocessable_entity
      end
    end
  end

  def destroy
    log_out if logged_in?
    redirect_to root_url, status: :see_other
  end
end
