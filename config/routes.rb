Rails.application.routes.draw do
  patch '/exit', to: "matches#disconnect"
  get '/online', to: "matches#be_waiting"
  patch '/update_location', to: "matches#update_location"
  patch '/entry/:id', to: "matches#await"
  get '/entry', to: "matches#new"
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html
  mount ActionCable.server => '/cable'
  root "matches#new"
  get "/base", to: "home#base"
  get "/signup", to: "users#new"
  get "/login", to: "sessions#new"
  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"
  resources :users, only: [:new, :create, :show, :update, :destroy]
end
