require "test_helper"

class UserTest < ActiveSupport::TestCase
  def setup
    @user = User.new(name: "user", girl: 0, date_of_birth: "2001-3-12", email: "user@example.com",
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
