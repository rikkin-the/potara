class AddDetailsAndOnlineToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :girl, :boolean
    add_column :users, :age, :string
    add_column :users, :online, :boolean
  end
end
