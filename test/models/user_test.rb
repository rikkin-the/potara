require "test_helper"

class UserTest < ActiveSupport::TestCase
  def setup
    @user = User.new(name: "user", email: "user@example.com",
                     password: "password", password_confirmation: "password")
  end

  test "user_can_be_setted" do
    assert @user.valid?
  end

  test "has_secure_password_confirmation" do
    @user.save
    assert !!@user.authenticate("password")
  end
end
