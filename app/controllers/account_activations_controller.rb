class AccountActivationsController < ApplicationController

  def new
    @user = User.new
  end

  def create
    @user = User.new(email: params[:user][:email])

    begin
      @user.save!(validate: false)
      UserMailer.account_activation(@user).deliver_now
      flash[:success] = "認証用のリンクを送りました。メールを確認してください(迷惑メールに入っている可能性があります)。"
      redirect_to root_url
    rescue ActiveRecord::RecordNotUnique
      flash[:danger] = "このメールアドレスはすでに登録済みです"
      redirect_to activation_path
    end
  end

  def edit
    user = User.find_by(email: params[:email])
    if user && !user.activated? && user.authenticated?(:activation, params[:id])
      user.update_attribute(:activated, true)
      user.update_attribute(:activated_at, Time.zone.now)
      redirect_to signup_path
    else
      flash[:danger] = "このリンクは無効です"
      redirect_to activation_path
    end
  end

end
