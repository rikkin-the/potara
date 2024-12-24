class UsersController < ApplicationController
  before_action :logged_in_user, only: [:show, :update, :destroy]
  before_action :correct_user, only: [:show, :update, :destroy]
  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      redirect_to success_path
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
      params.require(:user).permit(:name, :girl, :date_of_birth, :password,
                                   :password_confirmation, :agreement)
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
