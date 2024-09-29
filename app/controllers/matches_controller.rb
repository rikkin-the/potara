class MatchesController < ApplicationController
  def new
  end

  def update_location
    user = User.find_by(id: params[:id])
    latitude = params[:latitude]
    longitude = params[:longitude]

    if user && latitude && longitude
      user.update_attribute(:latitude, latitude)
      user.update_attribute(:longitude, longitude)
      render json: { statusText: "位置情報が更新されました" }, status: :ok
    else
      render json: { statusText: "位置情報が更新できませんでした" }, status: :unprocessable_entity
    end
  end

end
