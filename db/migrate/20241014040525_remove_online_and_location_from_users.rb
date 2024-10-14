class RemoveOnlineAndLocationFromUsers < ActiveRecord::Migration[7.0]
  def change
    remove_column :users, :online, :boolean
    remove_column :users, :longitude, :float
    remove_column :users, :latitude, :float
  end
end
