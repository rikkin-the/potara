class AddHeightToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :height, :integer
  end
end
