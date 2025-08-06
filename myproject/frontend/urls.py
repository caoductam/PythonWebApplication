from django.urls import path
from . import views

app_name = 'frontend'
urlpatterns = [
    path('',views.index, name='index'),
    # path('api/user', views.api_user, name='api_user'),
    # path('add_user',views.add_user, name='add_user'),
    # path('update_user/<int:id>',views.update_user, name='update_user'),
    # path('delete_user/<int:id>', views.delete_user, name='delete_user'),
    path('login/', views.login_view, name='login'),
]