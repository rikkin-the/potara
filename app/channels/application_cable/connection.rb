module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    def disconnect
      self.current_user = find_verified_user
      offline_status = {comment: nil, image: nil}
      self.current_user.update(offline_status)
      if self.current_user.girl
        $redis.del("girl_#{self.current_user.id}")
      else
        $redis.del("boy_#{self.current_user.id}")
      end
      $redis_matched.del(self.current_user.id)
    end

    private
      def find_verified_user
        if verified_user = User.find_by(id: cookies.encrypted[:user_id])
          verified_user
        else
          reject_unauthorized_connection
        end
      end
  end
end
