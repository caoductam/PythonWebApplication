from django.urls import path
from . import views

app_name = 'tag'
urlpatterns = [
    path('',views.index, name='index'),
    path('api/tag', views.api_tag, name='api_tag'),
    path('add_tag',views.add_tag, name='add_tag'),
    path('update_tag/<int:id>',views.update_tag, name='update_tag'),
    path('delete_tag/<int:id>', views.delete_tag, name='delete_tag'),
    
]