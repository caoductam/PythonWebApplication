from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.urls import reverse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from django.core.files.storage import default_storage
from django.conf import settings
import json
from .models import Document
from category.models import Category
from user.models import User

# Create your views here.
def index(request):
    return render(request, 'document/index.html')

def add_document(request):
    return render(request, 'document/add_document.html')


@csrf_exempt
def api_category(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM category")  # Đổi tên bảng cho đúng
        columns = [col[0] for col in cursor.description]
        categories = [dict(zip(columns, row)) for row in cursor.fetchall()]
    return JsonResponse(categories, safe=False)

@csrf_exempt
def api_user(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, username, role FROM user")  # Chỉ lấy trường cần thiết
        columns = [col[0] for col in cursor.description]
        users = [dict(zip(columns, row)) for row in cursor.fetchall()]
    return JsonResponse(users, safe=False)

@csrf_exempt
def upload_file(request):
    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']
        file_name = default_storage.save('documents/' + file.name, file)
        file_url = settings.MEDIA_URL + file_name
        return JsonResponse({
            'file_url': file_url,
            'file_name': file.name,
            'file_type': file.content_type,
            'file_size': file.size
        })
    return JsonResponse({'error': 'No file uploaded'}, status=400)

@csrf_exempt
def add_document_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            title = data.get('title')
            description = data.get('description')
            file_path = data.get('file_path')
            file_name = data.get('file_name')
            file_type = data.get('file_type')
            file_size = data.get('file_size')
            category_id = data.get('category_id_id')
            created_by_id = data.get('created_by_id')

            category = Category.objects.get(id=category_id)
            created_by = User.objects.get(id=created_by_id)
            doc = Document.objects.create(
                title=title,
                description=description,
                file_path=file_path,
                file_name=file_name,
                file_type=file_type,
                file_size=file_size,
                category_id=category,
                created_by=created_by
            )
            # Trả về url để frontend chuyển hướng
            return JsonResponse({'success': True, 'document_id': doc.id, 'redirect_url': '/documents/'})
        except Category.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Category not found'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'error': 'Invalid request'}, status=400)