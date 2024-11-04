# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: "Star Wars" }, { name: "Lord of the Rings" }])
#   Character.create(name: "Luke", movie: movies.first)
User.create!(name: "太郎", email: "boy@boy.com",
  password: "password", password_confirmation: "password", girl: 0,
  date_of_birth: "2002-01-01", activated: 1)

User.create!(name: "花子", email: "girl@girl.com",
  password: "password", password_confirmation: "password", girl: 1,
  date_of_birth: "2004-06-23", activated: 1)

date_from = Date.new(1995, 01, 01)
date_to = Date.new(2006, 11, 03)

25.times do |n|
  name = Faker::Name.male_first_name
  email = "email-#{n + 1}@example.com"
  password = "password"
  date_of_birth = Random.rand(date_from..date_to)
  User.create!({name: name, email: email,
    password: password, password_confirmation: password,
    date_of_birth: date_of_birth, girl: 0, activated: 1  })
end

25.times do |n|
  name = Faker::Name.female_first_name
  email = "email-#{n + 26}@example.com"
  password = "password"
  date_of_birth = Random.rand(date_from..date_to)
  User.create!({name: name, email: email,
    password: password, password_confirmation: password,
    date_of_birth: date_of_birth, girl: 1, activated: 1  })
end
