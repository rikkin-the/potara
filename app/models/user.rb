class User < ApplicationRecord
  attr_accessor :remember_token, :age
  before_save { self.email = self.email.downcase }
  validates :name, presence: true, length: { maximum: 50 }
  VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i
  validates :email, presence: true, length: { maximum: 255 },
                    format: { with: VALID_EMAIL_REGEX },
                    uniqueness: { case_sensitive: false}
  has_secure_password
  validates :password, presence: true, length: { minimum: 8 }, allow_nil: true
  validates :girl, inclusion: [true, false]
  validates :date_of_birth, presence: true
  has_one_attached :image do |attachable|
    attachable.variant :display, resize_to_limit: [500, 500]
  end

  def User.digest(string)
    cost = ActiveModel::SecurePassword.min_cost ? BCrypt::Engine::MIN_COST :
                                                  BCrypt::Engine.cost
    BCrypt::Password.create(string, cost: cost)
  end

  def User.new_token
    SecureRandom.urlsafe_base64
  end

  def remember
    self.remember_token = User.new_token
    update_attribute(:remember_digest, User.digest(remember_token))
  end

  def authenticated?(remember_token)
    return false if remember_digest.nil?
    BCrypt::Password.new(remember_digest).is_password?(remember_token)
  end

  def forget
    update_attribute(:remember_digest, nil)
  end

  def get_age
    today = Date.today
    self.age = today.year - date_of_birth.year
    if Date.new(today.year, date_of_birth.month, date_of_birth.day) > today
      self.age -= 1
    end
  end
end
