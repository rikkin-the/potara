class AddLocationColumnsToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :longitude, :float
    add_column :users, :latitude, :float
    add_column :users, :comment, :string
  end
end
