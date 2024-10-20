module ApplicationCable
  class Channel < ActionCable::Channel::Base
    include MatchesHelper
  end
end
