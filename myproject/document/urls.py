from django.urls import path
from . import views

app_name = 'document'

urlpatterns = [
    # API endpoints
    path('api/documents/', views.api_document_list, name='api_document_list'),
    path('api/categories/', views.api_category, name='api_category'),
    path('api/users/', views.api_user, name='api_user'),
    path('api/upload/', views.upload_file, name='upload_file'),
    path('api/add_document/', views.add_document_api, name='add_document_api'),  # thêm tài liệu mới

    # CRUD views
    path('', views.index, name='index'),
    path('add_document/', views.add_document, name='add_document'),
    path('update/<int:id>/', views.update_document, name='update_document'),
    path('delete/<int:id>/', views.delete_document, name='delete_document'),
]