from django.urls import path
from . import views

app_name = 'document'
urlpatterns = [
    path('',views.index, name='index'),
    # path('api/user', views.api_user, name='api_user'),
    # path('add_user',views.add_user, name='add_user'),
    # path('update_user/<int:id>',views.update_user, name='update_user'),
    # path('delete_user/<int:id>', views.delete_user, name='delete_user'),
    path('add_document', views.add_document, name='add_document'),
    path('api_category', views.api_category, name='api_category'),
    path('api_user', views.api_user, name='api_user'),
    path('api/upload', views.upload_file, name='upload_file'),
    path('api/add_document', views.add_document_api, name='add_document_api'),  # thêm tài liệu mới
]