Rails.application.routes.draw do
  patch '/update_location', to: "matches#update_location"
  get '/entry', to: "matches#new"
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html
  mount ActionCable.server => '/cable'
  root "home#base"
  get "/base", to: "home#base"
  get "/signup", to: "users#new"
  get "/login", to: "sessions#new"
  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"
  resources :users
end
