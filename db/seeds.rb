# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: "Star Wars" }, { name: "Lord of the Rings" }])
#   Character.create(name: "Luke", movie: movies.first)
$redis.flushall

User.create!(name: "太郎", email: "boy@boy.com",
  password: "password", password_confirmation: "password", girl: 0,
  date_of_birth: "2002-01-01", activated: 1)

User.create!(name: "花子", email: "girl@girl.com",
  password: "password", password_confirmation: "password", girl: 1,
  date_of_birth: "2004-06-23", activated: 1)

date_from = Date.new(1995, 01, 01)
date_to = Date.new(2006, 11, 03)
m_lat = 35.4681482
m_lng = 139.5037682
boys = [];
girls = [];

10.times do |n|
  name = Faker::Name.male_first_name
  email = "email-#{n + 1}@example.com"
  password = "password"
  date_of_birth = Random.rand(date_from..date_to)
  comment = Faker::Lorem.sentence(word_count: 10)
  user = User.create!({name: name, email: email,
    password: password, password_confirmation: password,
    date_of_birth: date_of_birth, girl: 0, activated: 1,
    comment: comment, height: rand(165..180)})
  user.image.attach(io: File.open(Rails.root.join("app/assets/images/man-#{(n%4) + 1}.png")), filename: "man-#{n + 1}.png")
  boys[n] = user
  variations = Array.new(2) { Random.rand(-0.1..0.1) }
  $redis.hset("boy_#{user.id}", "lat", m_lat + variations[0], "lng", m_lng + variations[1] )
end

10.times do |n|
  name = Faker::Name.female_first_name
  email = "email-#{n + 11}@example.com"
  password = "password"
  date_of_birth = Random.rand(date_from..date_to)
  comment = Faker::Lorem.sentence(word_count: 10)
  user = User.create!({name: name, email: email,
    password: password, password_confirmation: password,
    date_of_birth: date_of_birth, girl: 1, activated: 1,
    comment: comment, height: rand(150..170)})
  user.image.attach(io: File.open(Rails.root.join("app/assets/images/woman-#{(n%4) + 1}.png")), filename: "woman-#{n + 11}.png")
  girls[n] = user
  variations = Array.new(2) { Random.rand(-0.1..0.1) }
  $redis.hset("girl_#{user.id}", "lat", m_lat + variations[0], "lng", m_lng + variations[1])
end

boys.each do |boy|
  girls.each do |girl|
    $redis_past.rpush(boy.id, girl.id)
    $redis_past.rpush(girl.id, boy.id)
  end
end
