require "test_helper"

class MatchesControllerTest < ActionDispatch::IntegrationTest
  test "should get new" do
    get entry_path
    assert_response :success
  end
end
