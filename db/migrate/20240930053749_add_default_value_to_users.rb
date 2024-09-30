class AddDefaultValueToUsers < ActiveRecord::Migration[7.0]
  def change
    change_column_default(:users, :online, 0)
  end
end
