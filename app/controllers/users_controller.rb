class UsersController < ApplicationController
  before_action :logged_in_user, only: [:show, :update, :destroy]
  before_action :correct_user, only: [:show, :update, :destroy]
  def new
    @user = User.find(params[:id])
    if @user.activated?
      if @user.girl == nil
        render 'new'
      else
        flash[:danger] = "一度登録されたプロフィールは変更できません"
        redirect_to root_url
      end
    else
      flash[:danger] = "アカウントが認証されていません。メールをご確認ください。"
      redirect_to root_url
    end
  end

  def create
    @user = User.find(params[:id])
    if  @user.update(user_params)
      flash[:success] = "アカウントが作成されました！！"
      reset_session
      remember @user
      log_in @user
      redirect_to root_url
    else
      render 'new', status: :unprocessable_entity
    end
  end

  def success
  end

  def show
    @user = User.find(params[:id])
    @height_options = [["選択なし", ""]]
    (130..210).each do |i|
      @height_options.push(["#{i}cm", i])
    end
  end

  def update
    @user = User.find(params[:id])
    @height_options = [["選択なし", ""]]
    (130..210).each do |i|
      @height_options.push(["#{i}cm", i])
    end
    if @user.update(update_params)
      flash[:success] = "プロフィールが更新されました"
      redirect_to @user
    else
      render 'show', status: :unprocessable_entity
    end
  end

  def destroy
    User.find(params[:id]).destroy
    flash[:success] = "ユーザーは削除されました"
    redirect_to root_url, status: :see_other
  end

  private
    def user_params
      params.require(:user).permit(:girl, :name, :date_of_birth, :password, :password_confirmation)
    end

    def update_params
      params.require(:user).permit(:name, :height)
    end

    def logged_in_user
      unless logged_in?
        flash[:danger] = "ログインしてください"
        redirect_to login_url, status: :see_other
      end
    end

    def correct_user
      @user = User.find(params[:id])
      redirect_to(root_url, status: :see_other) unless current_user?(@user)
    end
end
