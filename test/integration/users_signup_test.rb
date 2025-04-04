require "test_helper"

class UsersSignupTest < ActionDispatch::IntegrationTest
  test "invalid signup information" do
    get signup_path
    assert_no_difference 'User.count' do
      post users_path, params: { user: { name: "",
                                         email: "user@invalid",
                                         password: "pass",
                                         password_confirmation: "pas" } }
    end
    assert_response :unprocessable_entity
    assert_template 'users/new'
  end

  test "valid signup information" do
    get signup_path
    assert_difference 'User.count', 1 do
      post users_path, params: { user: { name: "Example",
                                         girl: 0,
                                         date_of_birth: "2000-1-11",
                                         email: "email@example.com",
                                         password: "password",
                                         password_confirmation: "password" }}

    end
    follow_redirect!
    assert_template 'users/show'
    assert is_logged_in?
  end
end
