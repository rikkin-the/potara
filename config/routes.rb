Rails.application.routes.draw do
  #post 'matches/bot', to: "matches#create_bot"
  #get 'matches/before_release'
  get 'success', to: "users#success"
  get 'password_resets/new'
  get 'password_resets/edit'
  get '/online', to: "matches#be_waiting"
  patch '/entry/:id', to: "matches#await"
  get '/entry', to: "matches#new"
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html
  mount ActionCable.server => '/cable'
  root "matches#new"
  get "/base", to: "home#base"
  get "/activation", to: "account_activations#new"
  post "/activation", to: "account_activations#create"
  get "/signup", to: "users#new"
  get "/login", to: "sessions#new"
  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"
  resources :users, only: [:new, :create, :show, :update, :destroy]
  resources :account_activations, only: [:edit]
  resources :password_resets, only: [:new, :create, :edit, :update]
end
