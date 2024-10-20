Rails.application.routes.draw do
  get 'password_resets/new'
  get 'password_resets/edit'
  patch '/exit', to: "matches#disconnect"
  get '/online', to: "matches#be_waiting"
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
  resources :account_activations, only: [:edit]
  resources :password_resets, only: [:new, :create, :edit, :update]
end
