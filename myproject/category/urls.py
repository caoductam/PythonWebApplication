from django.urls import path
from . import views

app_name = 'category'
urlpatterns = [
    path('',views.index, name='index'),
    path('api/category', views.api_category, name='api_category'),
    path('add_category',views.add_category, name='add_category'),
    path('update_category/<int:id>',views.update_category, name='update_category'),
    path('delete_category/<int:id>', views.delete_category, name='delete_category'),
    
]